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

DAO Proposal #99

Description: Sell RAI to replenish DAI reserves and/or relieve upcoming peg pressure

Steps:
  1 - Move all PCV RAI to AAVE from Fuse Pool 9 via the ratioPCVControllerV2
  2 - Grant the MINTER role to the global rate limited minter
  3 - Grant the PCV_CONTROLLER role to the non-custodial price-bound psmW
*/

const fipNumber = '99'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const globalMaxRateLimitPerSecond = ethers.constants.WeiPerEther.mul(1_000_000); // 1 Million
  const perAddressRateLimitMaximum = ethers.constants.WeiPerEther.mul(100_000); // 100k
  const maxRateLimitPerSecondPerAddress = ethers.constants.WeiPerEther.mul(100_000); // 100k
  const maxBufferCap = ethers.constants.WeiPerEther.mul(50_000_000); // 50 million
  const globalBufferCap = ethers.constants.WeiPerEther.mul(100_000_000); // 100 million
  const globalInitialRateLimit = ethers.constants.WeiPerEther.mul(50_000); // 50k
  const mintFeeBasisPoints = 50;
  const redeemFeeBasisPoints = 50;
  const ceilingBasisPoints = 1000;
  const floorBasisPoints = 1000;

  // Deploy the global rate limited minter
  const globalRateLimitedMinterFactory = await ethers.getContractFactory('GlobalRateLimitedMinter');
  const globalRateLimitedMinter = await globalRateLimitedMinterFactory.deploy(
    addresses.core,
    globalMaxRateLimitPerSecond,
    perAddressRateLimitMaximum,
    maxRateLimitPerSecondPerAddress,
    maxBufferCap,
    globalBufferCap
  );

  await globalRateLimitedMinter.deployTransaction.wait();

  // Deploy the non-custodial price-bound psm
  const nonCustodialPriceBoundPSMFactory = await ethers.getContractFactory('NonCustodialPriceBoundPSM');

  const oracleParams = {
    coreAddress: addresses.core,
    oracleAddress: addresses.raiOracle,
    backupOracle: ethers.constants.AddressZero,
    decimalsNormalizer: 18
  };

  const rateLimitedParams = {
    maxRateLimitPerSecond: maxRateLimitPerSecondPerAddress,
    rateLimitPerSecond: globalInitialRateLimit,
    bufferCap: globalBufferCap
  };

  const psmParams = {
    mintFeeBasisPoints: mintFeeBasisPoints,
    redeemFeeBasisPoints: redeemFeeBasisPoints,
    underlyingToken: addresses.rai,
    pcvDeposit: addresses.aaveRaiPCVDeposit,
    rateLimitedMinter: addresses.globalRateLimitedMinter
  };

  const nonCustodialPriceBoundPSM = await nonCustodialPriceBoundPSMFactory.deploy(
    oracleParams,
    rateLimitedParams,
    psmParams,
    ceilingBasisPoints,
    floorBasisPoints
  );

  await nonCustodialPriceBoundPSM.deployTransaction.wait();

  return {
    globalRateLimitedMinter,
    nonCustodialPriceBoundPSM
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
