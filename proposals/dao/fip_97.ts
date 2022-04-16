import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

OA Proposal 97

Description:

Steps:
1. Deploy Turbo Fuse pool PCV deposit
2. Transfer $10 million Fei to the PCV Deposit
3. Deposit the Fei into the pool
*/

const fipNumber = '97'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy compoound PCV deposit
  const erc20CompoundPCVDepositFactory = await ethers.getContractFactory('ERC20CompoundPCVDeposit');
  const turboFusePCVDeposit = await erc20CompoundPCVDepositFactory.deploy(addresses.core, addresses.rariTurboFusePool);
  await turboFusePCVDeposit.deployTransaction.wait();

  logging && console.log('Turbo PCV Deposit deployed to:  ', turboFusePCVDeposit.address);

  return {
    turboFusePCVDeposit
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
  // Validate 10M Fei was seeded
  const seedAmount = ethers.constants.WeiPerEther.mul(9_999_999); // 9.9 M
  const pcvBalance = await contracts.turboFusePCVDeposit.balance();
  console.log({ pcvBalance });
  expect(pcvBalance).to.be.at.least(seedAmount);
};

export { deploy, setup, teardown, validate };
