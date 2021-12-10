import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

Peg Stability Module

Description: This module is used to manage the stability of the peg.

Steps:
  0 - Deploy PSM Router, (w)eth Peg Stability Module, and DAI PriceBoundPegStabilityModule
  1 - Grant Minter Role to Eth PSM
  2 - Grant Minter Role to DAI PSM
  3 - Create PSM_ADMIN_ROLE
  4 - Grant PSM_ADMIN_ROLE to Timelock
*/

const fipNumber = '9001'; // Change me!

// Constants for deploy. Tweak as needed.
const daiPSMMintFeeBasisPoints = 30;
const daiPSMRedeemFeeBasisPoints = 30;

const wethPSMMintFeeBasisPoints = 100;
const wethPSMRedeemFeeBasisPoints = 100;

const daiReservesThreshold = ethers.utils.parseEther('10000000');
const wethReservesThreshold = ethers.utils.parseEther('2500');

const daiFeiMintLimitPerSecond = ethers.utils.parseEther('10000');
const wethFeiMintLimitPerSecond = ethers.utils.parseEther('10000');

const daiPSMBufferCap = ethers.utils.parseEther('10000000');
const wethPSMBufferCap = ethers.utils.parseEther('10000000');

const daiDecimalsNormalizer = 0;
const wethDecimalsNormalizer = 0;

const daiFloorPrice = 9_500;
const daiCeilingPrice = 10_500;

// PCVDrip Controller Params

// drips can happen every hour
const dripFrequency = 3_600;

// do not incentivize these calls
const incentiveAmount = 0;

const daiDripAmount = ethers.utils.parseEther('10000000');
const wethDripAmount = ethers.utils.parseEther('2500');

const toBN = ethers.BigNumber.from;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const {
    core,
    fei,
    dai,
    weth,
    chainlinkDaiUsdOracleWrapper,
    chainlinkEthUsdOracleWrapper,
    compoundDaiPCVDeposit,
    aaveEthPCVDeposit
  } = addresses;

  if (!core) {
    throw new Error('Core address not set.');
  }

  const daiPSMFactory = await ethers.getContractFactory('PriceBoundPSM');
  const wethPSMFactory = await ethers.getContractFactory('PegStabilityModule');
  const psmRouterFactory = await ethers.getContractFactory('PSMRouter');
  const PCVDripControllerFactory = await ethers.getContractFactory('PCVDripController');

  // Deploy DAI Peg Stability Module
  // PSM will trade DAI between 98 cents and 1.02 cents.
  // If price is outside of this band, the PSM will not allow trades
  const daiPSM = await daiPSMFactory.deploy(
    daiFloorPrice,
    daiCeilingPrice,
    {
      coreAddress: core,
      oracleAddress: chainlinkDaiUsdOracleWrapper,
      backupOracle: chainlinkDaiUsdOracleWrapper,
      decimalsNormalizer: daiDecimalsNormalizer,
      doInvert: false
    },
    daiPSMMintFeeBasisPoints,
    daiPSMRedeemFeeBasisPoints,
    daiReservesThreshold,
    daiFeiMintLimitPerSecond,
    daiPSMBufferCap,
    dai,
    compoundDaiPCVDeposit
  );

  logging && console.log('daiPSM: ', daiPSM.address);

  // Deploy ETH Peg Stability Module
  const wethPSM = await wethPSMFactory.deploy(
    {
      coreAddress: core,
      oracleAddress: chainlinkEthUsdOracleWrapper,
      backupOracle: chainlinkEthUsdOracleWrapper,
      decimalsNormalizer: wethDecimalsNormalizer,
      doInvert: false
    },
    wethPSMMintFeeBasisPoints,
    wethPSMRedeemFeeBasisPoints,
    wethReservesThreshold,
    wethFeiMintLimitPerSecond,
    wethPSMBufferCap,
    weth,
    aaveEthPCVDeposit
  );

  logging && console.log('wethPSM: ', wethPSM.address);

  // Deploy PSM Router
  const psmRouter = await psmRouterFactory.deploy(wethPSM.address, fei);

  logging && console.log('psmRouter: ', psmRouter.address);

  const daiPCVDripController = await PCVDripControllerFactory.deploy(
    core,
    compoundDaiPCVDeposit,
    daiPSM.address,
    dripFrequency,
    daiDripAmount,
    incentiveAmount
  );

  logging && console.log('daiPCVDripController: ', daiPCVDripController.address);

  const wethPCVDripController = await PCVDripControllerFactory.deploy(
    core,
    aaveEthPCVDeposit,
    wethPSM.address,
    dripFrequency,
    wethDripAmount,
    incentiveAmount
  );

  logging && console.log('wethPCVDripController: ', wethPCVDripController.address);

  // Wait for all five contracts to deploy
  await Promise.all([
    daiPSM.deployTransaction.wait(),
    wethPSM.deployTransaction.wait(),
    psmRouter.deployTransaction.wait(),
    daiPCVDripController.deployTransaction.wait(),
    wethPCVDripController.deployTransaction.wait()
  ]);

  return {
    daiPSM,
    wethPSM,
    psmRouter,
    daiPCVDripController,
    wethPCVDripController
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  /// no setup needed for this proposal
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // no teardown needed for this proposal
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const {
    daiPCVDripController,
    wethPCVDripController,
    psmRouter,
    wethPSM,
    daiPSM,
    weth,
    dai,
    core,
    compoundDaiPCVDeposit,
    aaveEthPCVDeposit
  } = contracts;

  expect(await psmRouter.psm()).to.be.equal(wethPSM.address);

  expect(await daiPSM.underlyingToken()).to.be.equal(dai.address);
  expect(await wethPSM.underlyingToken()).to.be.equal(weth.address);

  expect(await daiPSM.redeemFeeBasisPoints()).to.be.equal(daiPSMRedeemFeeBasisPoints);
  expect(await wethPSM.redeemFeeBasisPoints()).to.be.equal(wethPSMRedeemFeeBasisPoints);

  expect(await daiPSM.mintFeeBasisPoints()).to.be.equal(daiPSMMintFeeBasisPoints);
  expect(await wethPSM.mintFeeBasisPoints()).to.be.equal(wethPSMMintFeeBasisPoints);

  expect(await daiPSM.reservesThreshold()).to.be.equal(daiReservesThreshold);
  expect(await wethPSM.reservesThreshold()).to.be.equal(wethReservesThreshold);

  expect(await daiPSM.balance()).to.be.equal(daiReservesThreshold);
  expect(await wethPSM.balance()).to.be.equal(wethReservesThreshold);

  expect(await daiPSM.surplusTarget()).to.be.equal(compoundDaiPCVDeposit.address);
  expect(await wethPSM.surplusTarget()).to.be.equal(aaveEthPCVDeposit.address);

  expect(await daiPSM.rateLimitPerSecond()).to.be.equal(toBN(10_000).mul(ethers.constants.WeiPerEther));
  expect(await wethPSM.rateLimitPerSecond()).to.be.equal(toBN(10_000).mul(ethers.constants.WeiPerEther));

  expect(await daiPSM.buffer()).to.be.equal(toBN(10_000_000).mul(ethers.constants.WeiPerEther));
  expect(await wethPSM.buffer()).to.be.equal(toBN(10_000_000).mul(ethers.constants.WeiPerEther));

  expect(await daiPSM.bufferCap()).to.be.equal(daiPSMBufferCap);
  expect(await wethPSM.bufferCap()).to.be.equal(wethPSMBufferCap);

  expect(await daiPCVDripController.target()).to.be.equal(daiPSM.address);
  expect(await wethPCVDripController.target()).to.be.equal(wethPSM.address);

  expect(await core.isMinter(daiPSM.address)).to.be.true;
  expect(await core.isMinter(wethPSM.address)).to.be.true;

  expect(await core.isPCVController(wethPCVDripController.address)).to.be.true;
  expect(await core.isPCVController(daiPCVDripController.address)).to.be.true;
};

export { deploy, setup, teardown, validate };
