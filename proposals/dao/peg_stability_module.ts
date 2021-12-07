import hre, { ethers, artifacts } from 'hardhat';
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

const daiReservesThreshold = ethers.utils.parseEther('30000000');
const wethReservesThreshold = ethers.utils.parseEther('7500');

const daiFeiMintLimitPerSecond = ethers.utils.parseEther('10000');
const wethFeiMintLimitPerSecond = ethers.utils.parseEther('10000');

const daiPSMBufferCap = ethers.utils.parseEther('10000000');
const wethPSMBufferCap = ethers.utils.parseEther('10000000');

const daiDecimalsNormalizer = 18;
const wethDecimalsNormalizer = 18;

// PCVDrip Controller Params

// drips can happen every hour
const dripFrequency = 3_600;

// do not incentivize these calls
const incentiveAmount = 0;

const daiDripAmount = ethers.utils.parseEther('5000000');
const wethDripAmount = ethers.utils.parseEther('1250');

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
    9_800,
    10_200,
    {
      coreAddress: core,
      oracleAddress: chainlinkDaiUsdOracleWrapper,
      backupOracle: chainlinkDaiUsdOracleWrapper,
      decimalsNormalizer: daiDecimalsNormalizer, // todo, figure out if normalization is needed
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

  // Deploy ETH Peg Stability Module
  const wethPSM = await wethPSMFactory.deploy(
    {
      coreAddress: core,
      oracleAddress: chainlinkEthUsdOracleWrapper,
      backupOracle: chainlinkEthUsdOracleWrapper,
      decimalsNormalizer: wethDecimalsNormalizer, // todo, figure out if normalization is needed
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

  // Deploy PSM Router
  const psmRouter = await psmRouterFactory.deploy(wethPSM.address, fei);

  const daiPCVDripController = await PCVDripControllerFactory.deploy(
    core,
    compoundDaiPCVDeposit,
    daiPSM.address,
    dripFrequency,
    daiDripAmount,
    incentiveAmount
  );

  const wethPCVDripController = await PCVDripControllerFactory.deploy(
    core,
    aaveEthPCVDeposit,
    wethPSM.address,
    dripFrequency,
    wethDripAmount,
    incentiveAmount
  );

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
    psmRouter
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip${fipNumber}`);
  const { compoundDaiPCVDeposit, aaveEthPCVDeposit, feiDAOTimelock, daiPSM, wethPSM } = contracts;
  const timelockSigner = await ethers.getSigner(feiDAOTimelock.address);
  // fund both PSM's with 30m in assets
  await compoundDaiPCVDeposit.connect(timelockSigner).withdraw(daiPSM.address, daiReservesThreshold);
  await aaveEthPCVDeposit.connect(timelockSigner).withdraw(wethPSM.address, wethReservesThreshold);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { psmRouter, wethPSM, daiPSM, weth, dai } = contracts;

  expect(await psmRouter.psm()).to.be.equal(wethPSM.address);
  expect(await psmRouter.redeemActive()).to.be.false;

  expect(await wethPSM.underlyingToken()).to.be.equal(weth.address);
  expect(await daiPSM.underlyingToken()).to.be.equal(dai.address);

  expect(await wethPSM.redeemFeeBasisPoints()).to.be.equal(wethPSMRedeemFeeBasisPoints);
  expect(await daiPSM.redeemFeeBasisPoints()).to.be.equal(daiPSMRedeemFeeBasisPoints);

  expect(await wethPSM.mintFeeBasisPoints()).to.be.equal(wethPSMMintFeeBasisPoints);
  expect(await daiPSM.mintFeeBasisPoints()).to.be.equal(daiPSMMintFeeBasisPoints);

  expect(await daiPSM.reservesThreshold()).to.be.equal(daiReservesThreshold);
  expect(await wethPSM.reservesThreshold()).to.be.equal(wethReservesThreshold);

  expect(await daiPSM.balance()).to.be.equal(daiReservesThreshold);
  expect(await wethPSM.balance()).to.be.equal(wethReservesThreshold);
};

export { deploy, setup, teardown, validate };
