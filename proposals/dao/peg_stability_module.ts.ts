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
  1 - Deploy PSM Router, (w)eth Peg Stability Module, and DAI PriceBoundPegStabilityModule
  2 - Grant Minter Role to Eth PSM
  3 - Grant Minter Role to DAI PSM
  4 - Create PSM_ADMIN_ROLE
  5 - Grant PSM_ADMIN_ROLE to Eth PSM
  6 - Grant PSM_ADMIN_ROLE to DAI PSM
*/

const fipNumber = '9001'; // Change me!

// Constants for deploy. Tweak as needed.
const daiPSMMintFeeBasisPoints = 50;
const daiPSMRedeemFeeBasisPoints = 50;

const wethPSMMintFeeBasisPoints = 50;
const wethPSMRedeemFeeBasisPoints = 50;

const daiReservesThreshold = ethers.utils.parseEther('10_000_000');
const wethReservesThreshold = ethers.utils.parseEther('1000');

const daiFeiMintLimitPerSecond = 10000;
const wethFeiMintLimitPerSecond = 10000;

const daiPSMBufferCap = ethers.utils.parseEther('10_000_000');
const wethPSMBufferCap = ethers.utils.parseEther('10_000_000');

const daiDecimalsNormalizer = 18;
const wethDecimalsNormalizer = 18;

const excessReservesDestination = 'fixme';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const { core, fei, dai, weth, daiOracle, ethOracle } = addresses;

  if (!core) {
    throw new Error('Core address not set.');
  }

  const daiPSMFactory = await ethers.getContractFactory('PriceBoundPSM');
  const wethPSMFactory = await ethers.getContractFactory('PegStabilityModule');
  const psmRouterFactory = await ethers.getContractFactory('PSMRouter');

  // Deploy DAI Peg Stability Module
  const daiPSM = await daiPSMFactory.deploy(
    core,
    daiOracle,
    daiOracle,
    daiPSMMintFeeBasisPoints,
    daiPSMRedeemFeeBasisPoints,
    daiReservesThreshold,
    daiFeiMintLimitPerSecond,
    daiPSMBufferCap,
    daiDecimalsNormalizer,
    false,
    dai,
    excessReservesDestination
  );

  // Deploy ETH Peg Stability Module
  const wethPSM = await wethPSMFactory.deploy(
    core,
    ethOracle,
    ethOracle,
    wethPSMMintFeeBasisPoints,
    wethPSMRedeemFeeBasisPoints,
    wethReservesThreshold,
    wethFeiMintLimitPerSecond,
    wethPSMBufferCap,
    wethDecimalsNormalizer,
    false,
    weth,
    excessReservesDestination
  );

  // Deploy PSM Router
  const psmRouter = await psmRouterFactory.deploy(wethPSM.address);

  // Wait for all three to deploy
  await Promise.all([
    daiPSM.deployTransaction.wait(),
    wethPSM.deployTransaction.wait(),
    psmRouter.deployTransaction.wait()
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
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in validate for fip${fipNumber}`);
};

export { deploy, setup, teardown, validate };
