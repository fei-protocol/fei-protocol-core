import { PegStabilityModule, UniswapV3OracleWrapper } from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { expectApprox, expectRevert, getImpersonatedSigner, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';

describe('Backup Oracles', function () {
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

    const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);

    // Add backup oracle to DAI PSM
    daiPSM = contracts.daiFixedPricePSM as PegStabilityModule;
    console.log('dai psm address: ', daiPSM.address);

    daiUsdcBackupOracle = contracts.daiUsdcTwapOracle as UniswapV3OracleWrapper;

    console.log('dai oracle address: ', daiUsdcBackupOracle.address);
    await daiPSM.connect(daoSigner).setBackupOracle(daiUsdcBackupOracle.address);

    // Add backup oracle to ETH PSM
    ethPSM = contracts.ethPSM as PegStabilityModule;
    ethUsdcBackupOracle = contracts.ethUsdcTwapOracle as UniswapV3OracleWrapper;
    await ethPSM.connect(daoSigner).setBackupOracle(ethUsdcBackupOracle.address);
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

  it('should have set backup oracle', async () => {
    const daiBackupOracle = await daiPSM.backupOracle();
    const ethBackupOracle = await ethPSM.backupOracle();
    expect(daiBackupOracle).to.equal(daiUsdcBackupOracle.address);
    expect(ethBackupOracle).to.equal(ethUsdcBackupOracle.address);
  });

  it.only('should read reasonable Uniswap V3 TWAP oracle price', async () => {
    // Can call the oracle directly to query price
    const [daiPrice, isValid] = await daiUsdcBackupOracle.read();

    console.log({ isValid });
    console.log('daiPrice: ', daiPrice.toString());

    expect(isValid).to.be.true;
    expect(daiPrice.toString()).to.be.equal('1000000000000000000');
  });

  it.only('should read Uniswap V3 TWAP oracle price comparable to primary oracle price', async () => {
    const primaryChainlinkOracle = contracts.chainlinkDaiUsdOracleWrapper;

    const primaryOraclePrice = await primaryChainlinkOracle.read();
    const backupOraclePrice = await daiUsdcBackupOracle.read();

    console.log('primary oracle price: ', primaryOraclePrice.toString());
    console.log('backup oracle price: ', backupOraclePrice.toString());

    expect(primaryOraclePrice.toString()).to.equal(backupOraclePrice.toString());
  });
});
