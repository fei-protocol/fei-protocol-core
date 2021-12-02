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
const daiPSMMintFeeBasisPoints = 50;
const daiPSMRedeemFeeBasisPoints = 50;

const wethPSMMintFeeBasisPoints = 50;
const wethPSMRedeemFeeBasisPoints = 50;

const daiReservesThreshold = ethers.utils.parseEther('10000000');
const wethReservesThreshold = ethers.utils.parseEther('1000');

const daiFeiMintLimitPerSecond = ethers.utils.parseEther('10000');
const wethFeiMintLimitPerSecond = ethers.utils.parseEther('10000');

const daiPSMBufferCap = ethers.utils.parseEther('10000000');
const wethPSMBufferCap = ethers.utils.parseEther('10000000');

const daiDecimalsNormalizer = 18;
const wethDecimalsNormalizer = 18;

/// TODO where do we want to send excess reserves?
const excessReservesDestination = 'fixme';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const { core, fei, dai, weth, chainlinkDaiUsdOracleWrapper, chainlinkEthUsdOracleWrapper } = addresses;

  if (!core) {
    throw new Error('Core address not set.');
  }

  const daiPSMFactory = await ethers.getContractFactory('PriceBoundPSM');
  const wethPSMFactory = await ethers.getContractFactory('PegStabilityModule');
  const psmRouterFactory = await ethers.getContractFactory('PSMRouter');

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
    dai // TODO REPLACE THIS
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
    dai // TODO REPLACE THIS
  );

  // Deploy PSM Router
  const psmRouter = await psmRouterFactory.deploy(wethPSM.address, fei);

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
