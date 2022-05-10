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

Swap DPI for DAI

Description:

Steps:
  1 - 
  2 -
  3 - 

*/

const fipNumber = 'swap_dpi';

// LBP Swapper config
const LBP_FREQUENCY = '86400'; // 24 hours
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(1_000_000); // 1M
let poolId; // auction pool id

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');
  const dpiToDaiSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: addresses.chainlinkDpiUsdOracleWrapper,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    '100000000000000000', // small weight 10%
    '900000000000000000', // large weight 90%
    addresses.dpi,
    addresses.dai,
    addresses.daiFixedPricePSM, // send DAI to DAI PSM
    MIN_LBP_SIZE
  );

  await dpiToDaiSwapper.deployed();
  logging && console.log('DPI to DAI swapper deployed to: ', dpiToDaiSwapper.address);

  return {
    dpiToDaiSwapper
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
