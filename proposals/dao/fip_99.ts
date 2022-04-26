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
  1 - Move 80% of PCV RAI to AAVE from Fuse Pool 9 via the ratioPCVControllerV2
  2 - Call depsoit() on the aave rai pcv deposit
  3 - Grant the MINTER role to the global rate limited minter
  4 - Grant the PCV_CONTROLLER role to the non-custodial price-bound psm
  5 - Pause Redeem on the rai non-custodial price-bound psm
*/

const fipNumber = '99'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Global rate-limited minter params
  const globalMaxRateLimitPerSecond = ethers.constants.WeiPerEther.mul(1_000_000); // 1 Million
  const perAddressRateLimitMaximum = ethers.constants.WeiPerEther.mul(100_000); // 100k
  const maxRateLimitPerSecondPerAddress = ethers.constants.WeiPerEther.mul(100_000); // 100k
  const maxBufferCap = ethers.constants.WeiPerEther.mul(50_000_000); // 50 million
  const globalBufferCap = ethers.constants.WeiPerEther.mul(100_000_000); // 100 million

  // Fixed-price PSM params
  const mintFeeBasisPoints = 0;
  const redeemFeeBasisPoints = 0;
  const ceilingBasisPoints = ethers.constants.WeiPerEther.mul(1_000_000); // 1 million basis points. yep.
  const floorBasisPoints = 30000;
  const redeemMaxRateLimitPerSecond = ethers.constants.WeiPerEther.mul(1_000_000); // 1 Million
  const redeemInitialRateLimitPerSecond = ethers.constants.WeiPerEther.mul(50_000); // 50k
  const redeemBufferCap = ethers.constants.WeiPerEther.mul(10_000_000); // 10 million

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

  logging && console.log('Global rate limited minter deployed');

  // Deploy the non-custodial price-bound psm
  const nonCustodialPriceBoundPSMFactory = await ethers.getContractFactory('NonCustodialPriceBoundPSM');

  const oracleParams = {
    coreAddress: addresses.core,
    oracleAddress: addresses.chainlinkRaiUsdCompositeOracle,
    backupOracle: ethers.constants.AddressZero,
    decimalsNormalizer: 18
  };

  logging && console.log('Oracle params created');
  logging && console.log(`${JSON.stringify(oracleParams)}`);

  // These rate-limit params are for *redeeming*.
  // The minting rate-limit params are handled by the global rate limited minter.
  const rateLimitedParams = {
    maxRateLimitPerSecond: redeemMaxRateLimitPerSecond.toString(),
    rateLimitPerSecond: redeemInitialRateLimitPerSecond.toString(),
    bufferCap: redeemBufferCap.toString()
  };

  logging && console.log('Rate-limit params created');
  logging && console.log(`${JSON.stringify(rateLimitedParams)}`);

  const psmParams = {
    mintFeeBasisPoints: mintFeeBasisPoints,
    redeemFeeBasisPoints: redeemFeeBasisPoints,
    underlyingToken: addresses.rai,
    pcvDeposit: addresses.aaveRaiPCVDeposit,
    rateLimitedMinter: globalRateLimitedMinter.address
  };

  logging && console.log('PSM params created');
  logging && console.log(`${JSON.stringify(psmParams)}`);

  const raiNonCustodialPriceBoundPSM = await nonCustodialPriceBoundPSMFactory.deploy(
    oracleParams,
    rateLimitedParams,
    psmParams,
    ceilingBasisPoints,
    floorBasisPoints
  );

  await raiNonCustodialPriceBoundPSM.deployTransaction.wait();

  logging && console.log('Non-custodial price-bound PSM deployed');

  return {
    globalRateLimitedMinter,
    raiNonCustodialPriceBoundPSM
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
  // Ensure that the global rate limited minter has the MINTER role & the noncustodialpriceboundpsm has the PCV_CONTROLLER role
  await contracts.core.hasRole(ethers.utils.id('MINTER_ROLE'), addresses.globalRateLimitedMinter);
  await contracts.core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.raiNonCustodialPriceBoundPSM);

  // Ensure that the rai aave pcv deposit has >= 10m RAI
  expect((await contracts.aaveRaiPCVDeposit.balance()).gte(ethers.constants.WeiPerEther.mul(10_000_000)));
};

export { deploy, setup, teardown, validate };
