import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';

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
  // 1. Deploy compound PCV deposit
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
  // feiDAOTimelock is TURBO_ADMIN_ROLE
  const governorSigner = await getImpersonatedSigner(addresses.feiDAOTimelock);

  const turboAdminABI = ['function _setWhitelistStatuses(address[] calldata suppliers, bool[] calldata statuses)'];
  const turboAdmin = new ethers.Contract(addresses.turboAdmin, turboAdminABI, governorSigner);
  await turboAdmin._setWhitelistStatuses([contracts.turboFusePCVDeposit.address], [true]);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Previously transferred balance
  const previousBalance = ethers.constants.WeiPerEther.mul(1_000_000);
  // Validate 10M Fei was seeded
  const seedAmount = ethers.constants.WeiPerEther.mul(10_000_000); // 10 M
  const pcvBalance = await contracts.turboFusePCVDeposit.balance();
  expect(pcvBalance).to.equal(seedAmount.add(previousBalance));
};

export { deploy, setup, teardown, validate };
