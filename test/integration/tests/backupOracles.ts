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

const toBN = ethers.BigNumber.from;
const BNe18 = (x: any) => ethers.constants.WeiPerEther.mul(toBN(x));

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
    daiUsdcBackupOracle = contracts.daiUsdcTwapOracle as UniswapV3OracleWrapper;
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

  it('should read reasonable Uniswap V3 TWAP oracle price', async () => {
    const [daiPrice, isValid] = await daiUsdcBackupOracle.read();
    expect(isValid).to.be.true;
    expectApprox(daiPrice.toString(), BNe18(1).toString());
  });

  it('should read Uniswap V3 TWAP oracle price comparable to primary oracle price', async () => {
    const primaryChainlinkOracle = contracts.chainlinkDaiUsdOracleWrapper;
    const primaryOraclePrice = await primaryChainlinkOracle.read();
    const backupOraclePrice = await daiUsdcBackupOracle.read();

    expectApprox(primaryOraclePrice.toString(), backupOraclePrice.toString());
  });
});
