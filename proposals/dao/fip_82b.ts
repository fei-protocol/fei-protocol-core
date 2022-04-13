import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { Contract } from 'ethers';

/*

DAO Proposal fip_82b

Description:
1. Transfer admin of non-major TribeRoles to ROLE_ADMIN, to allow the TribalCouncil to grant out
2. Create several new TribeRoles for management of the protocol, with the ROLE_ADMIN as their admin
3. Transfer contract admins of various contracts to these new roles
4. Grant the TribalCouncil the various roles it needs to run the protocol
*/

const fipNumber = 'fip_82b';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log(`No deploy actions for fip${fipNumber}`);
  return {
    // put returned contract objects here
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
  await validateTransferredRoleAdmins(contracts.core);
  await validateNewCouncilRoles(contracts.core);
  await validateContractAdmins(contracts);
  await validateTribalCouncilRoles(contracts.core, addresses.tribalCouncilTimelock);
  await validateCallingContractsHaveNewAdmin(contracts.core, addresses);
};

/// Validate that all non-major TribeRoles have had their admins transferred to the ROLE_ADMIN
const validateTransferredRoleAdmins = async (core: Contract) => {
  const ROLE_ADMIN = ethers.utils.id('ROLE_ADMIN');

  // Non-major roles that previously had 0x0 as their admin
  expect(await core.getRoleAdmin(ethers.utils.id('PARAMETER_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('MINOR_ROLE_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('MINTER_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('OPTIMISTIC_ADMIN'))).to.be.equal(ROLE_ADMIN);

  // Non-major roles that previously had GOVERNOR as their admin
  expect(await core.getRoleAdmin(ethers.utils.id('ORACLE_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('SWAP_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('VOTIUM_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
};

/// Validate that the expected new TribeRoles have been created
const validateNewCouncilRoles = async (core: Contract) => {
  const ROLE_ADMIN = ethers.utils.id('ROLE_ADMIN');

  expect(await core.getRoleAdmin(ethers.utils.id('FUSE_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('FEI_MINT_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('PCV_MINOR_PARAM_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('PSM_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
};

/// Validate that the relevant contract admins have been set to their expected values
const validateContractAdmins = async (contracts: NamedContracts) => {
  expect(await contracts.fuseGuardian.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('FUSE_ADMIN'));

  // expect(await contracts.optimisticMinter.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('FEI_MINT_ADMIN'));
  // expect(await contracts.pcvEquityMinter.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('FEI_MINT_ADMIN'));
  // expect(await contracts.indexDelegator.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_MINOR_PARAM_ROLE'));
  expect(await contracts.ethTokemakPCVDeposit.CONTRACT_ADMIN_ROLE()).to.be.equal(
    ethers.utils.id('PCV_MINOR_PARAM_ROLE')
  );
  expect(await contracts.uniswapPCVDeposit.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_MINOR_PARAM_ROLE'));

  expect(await contracts.daiPSMFeiSkimmer.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_MINOR_PARAM_ROLE'));
  expect(await contracts.lusdPSMFeiSkimmer.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_MINOR_PARAM_ROLE'));
  expect(await contracts.ethPSMFeiSkimmer.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_MINOR_PARAM_ROLE'));

  expect(await contracts.aaveEthPCVDripController.CONTRACT_ADMIN_ROLE()).to.be.equal(
    ethers.utils.id('PCV_MINOR_PARAM_ROLE')
  );
  expect(await contracts.daiPCVDripController.CONTRACT_ADMIN_ROLE()).to.be.equal(
    ethers.utils.id('PCV_MINOR_PARAM_ROLE')
  );
  expect(await contracts.lusdPCVDripController.CONTRACT_ADMIN_ROLE()).to.be.equal(
    ethers.utils.id('PCV_MINOR_PARAM_ROLE')
  );
  expect(await contracts.compoundEthPCVDripController.CONTRACT_ADMIN_ROLE()).to.be.equal(
    ethers.utils.id('PCV_MINOR_PARAM_ROLE')
  );
};

const validateCallingContractsHaveNewAdmin = async (core: Contract, addresses: NamedAddresses) => {
  // TRIBAL_CHIEF_ADMIN_ROLE : FUSE_ADMIN
  expect(await core.hasRole(ethers.utils.id('FUSE_ADMIN'), addresses.optimisticTimelock)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('FUSE_ADMIN'), addresses.tribalChiefSyncV2)).to.be.true;

  //
  expect(await core.hasRole(ethers.utils.id('FEI_MINT_ADMIN'), addresses.core)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('FEI_MINT_ADMIN'), addresses.feiDAOTimelock)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('FEI_MINT_ADMIN'), addresses.roleBastion)).to.be.true;

  // TOKEMAK_DEPOSIT_ADMIN_ROLE : PCV_MINOR_PARAM_ROLE
  expect(await core.hasRole(ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE'), addresses.optimisticTimelock)).to.be.true;

  // GOVERNOR : PCV_MINOR_PARAM_ROLE
  expect(await core.hasRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.feiDAOTimelock)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.core)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.roleBastion)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.optimisticTimelock)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.opsOptimisticTimelock)).to.be.true;
};

const validateTribalCouncilRoles = async (core: Contract, tribalCouncilTimelockAddress: string) => {
  expect(await core.hasRole(ethers.utils.id('FUSE_ADMIN'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('FEI_MINT_ADMIN'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('ORACLE_ADMIN_ROLE'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PSM_ADMIN_ROLE'), tribalCouncilTimelockAddress)).to.be.true;
};

export { deploy, setup, teardown, validate };
