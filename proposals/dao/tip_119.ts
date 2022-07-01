import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';

const toBN = BigNumber.from;

/*

Tribal Council Proposal: TIP-119: Add gOHM to Collaterisation Oracle

1. Deploy gOHM oracle
2. Set oracle on collaterisation oracle
3. Add gOHM to CR 

*/

const fipNumber = 'tip_119'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  ////////////// 1. Create and deploy gOHM USD oracle
  const GOhmEthOracleFactory = await ethers.getContractFactory('GOhmEthOracle');
  const gOHMEthOracle = await GOhmEthOracleFactory.deploy(addresses.core, addresses.chainlinkOHMV2EthOracle);
  await gOHMEthOracle.deployed();

  logging && console.log(`Deployed gOHM Eth Oracle at ${gOHMEthOracle.address}`);

  // Create the gOHM USD oracle
  const CompositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const gOhmUSDOracle = await CompositeOracleFactory.deploy(
    addresses.core,
    gOHMEthOracle.address,
    addresses.chainlinkEthUsdOracleWrapper,
    false
  );

  logging && console.log('Deployed gOHM oracle to: ', gOhmUSDOracle.address);
  return {
    gOhmUSDOracle,
    gOHMEthOracle
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
  const gohm = contracts.gohm;

  //////////// 1. Validate gOHM ETH oracle price is valid ////////////
  // TODO

  ////////////    2. gOHM USD oracle price is valid   //////////////
  const gOhmUSDPrice = (await contracts.gOhmUSDOracle.read())[0];
  expect(toBN(gOhmUSDPrice.value)).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(2_500)); // $2500
  expect(toBN(gOhmUSDPrice.value)).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(3_400)); // $3400
};

export { deploy, setup, teardown, validate };
