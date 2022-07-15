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

Nope DAO V2

Description:
1. Deploy the new NopeDAO
2. Revoke the powers of the previous NopeDAO
3. Grant powers to the new NopeDAO
4. Transfer admin of the POD_VETO_ADMIN role to the DAO timelock

*/

const fipNumber = '9001'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const NopeDAOFactory = await ethers.getContractFactory('NopeDAO');
  const nopeDAO = await NopeDAOFactory.deploy(addresses.tribe, addresses.core);
  logging && console.log('NopeDAO deployed to: ', nopeDAO.address);
  return {
    nopeDAO
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
  // 1. Validate new NopeDAO configured
  expect(await contracts.nopeDAO.quorum(0)).to.be.equal(ethers.constants.WeiPerEther.mul(10_000_000));
  expect(await contracts.nopeDAO.votingDelay()).to.be.equal(0);

  // Measured in blocks by OZ, assumed 13s block time. (86400 * 4) / 13
  expect(await contracts.nopeDAO.votingPeriod()).to.be.equal(26585);
  expect(await contracts.nopeDAO.token()).to.be.equal(addresses.tribe);

  // 2. Validate old NopeDAO powers revoked
  const POD_VETO_ADMIN = ethers.utils.id('POD_VETO_ADMIN');
  expect(await contracts.core.hasRole(POD_VETO_ADMIN, addresses.nopeDAOV1)).to.be.false;

  // 3. Validate new NopeDAO has relevant powers
  expect(await contracts.core.hasRole(POD_VETO_ADMIN, addresses.nopeDAO)).to.be.true;

  // 4. Validate POD_VETO_ADMIN role admin is now GOVERN_ROLE
  expect(await contracts.core.getRoleAdmin(POD_VETO_ADMIN)).to.be.equal(ethers.utils.id('GOVERN_ROLE'));
};

export { deploy, setup, teardown, validate };
