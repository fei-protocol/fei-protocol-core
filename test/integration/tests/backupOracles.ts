import { PegStabilityModule, UniswapV3OracleWrapper } from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { expectApprox, getImpersonatedSigner, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';

describe.only('Backup Oracles', function () {
  let contracts: NamedContracts;
  let deployAddress: SignerWithAddress;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let daiPSM: PegStabilityModule;
  let ethPSM: PegStabilityModule;
  let daiUsdcBackupOracle: UniswapV3OracleWrapper;
  let ethUsdcBackupOracle: UniswapV3OracleWrapper;

  before(async () => {
    chai.use(CBN(BigNumber));
    chai.use(solidity);
    await resetFork();
  });

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0];
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress.address,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    daiPSM = contracts.daiFixedPricePSM as PegStabilityModule;
    ethPSM = contracts.ethPSM as PegStabilityModule;
    daiUsdcBackupOracle = contracts.daiUsdcTwapOracle as UniswapV3OracleWrapper;
    ethUsdcBackupOracle = contracts.ethUsdcTwapOracle as UniswapV3OracleWrapper;
  });

  before(async function () {
    const turnPSMOn = async (psm: PegStabilityModule) => {
      const redeemPaused = await psm.redeemPaused();
      if (redeemPaused) {
        await psm.unpauseRedeem();
      }
      const paused = await psm.paused();
      if (paused) {
        await psm.unpause();
      }
    };

    await turnPSMOn(daiPSM);
    await turnPSMOn(ethPSM);
  });

  it('should read Uniswap V3 TWAP oracle price comparable to primary oracle price', async () => {
    const primaryDaiChainlinkOracle = contracts.chainlinkDaiUsdOracleWrapper;
    const [primaryDaiOraclePrice] = await primaryDaiChainlinkOracle.read();
    const [backupDaiOraclePrice, daiPriceValid] = await daiUsdcBackupOracle.read();
    expect(daiPriceValid).to.be.true;
    expectApprox(primaryDaiOraclePrice.toString(), backupDaiOraclePrice.toString());

    const primaryEthChainlinkOracle = contracts.chainlinkEthUsdOracleWrapper;
    const [primaryEthOraclePrice] = await primaryEthChainlinkOracle.read();
    const [backupEthOraclePrice, ethPriceValid] = await ethUsdcBackupOracle.read();
    expect(ethPriceValid).to.be.true;
    expectApprox(primaryEthOraclePrice.toString(), backupEthOraclePrice.toString());
  });

  it('should have PSM fallback to backup oracle', async () => {
    const primaryDaiChainlinkOracle = contracts.chainlinkDaiUsdOracleWrapper;

    // Primary oracle price
    const [, initialIsValid] = await primaryDaiChainlinkOracle.read();
    expect(initialIsValid).to.be.true;

    const [primaryPrice] = await daiPSM.readOracle();

    // Trigger fallback to backup, by pausing Chainlink to force it to return an invalid price
    const governorSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);

    await primaryDaiChainlinkOracle.connect(governorSigner).pause();

    // Fallback oracle price
    const [, fallbackIsValid] = await primaryDaiChainlinkOracle.read();
    expect(fallbackIsValid).to.be.false;

    const [fallbackPrice] = await daiPSM.readOracle();
    expectApprox(fallbackPrice.toString(), primaryPrice.toString());
  });
});
