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
import { validateArraysEqual } from '@test/helpers';

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
  const deploySigner = (await ethers.getSigners())[0];
  const previousPCVGuardian = await ethers.getContractAt('PCVGuardian', addresses.pcvGuardian, deploySigner);
  const safeAddresses = await previousPCVGuardian.getSafeAddresses();

  const pcvGuardianFactory = await ethers.getContractFactory('PCVGuardian');
  const pcvGuardianNew = await pcvGuardianFactory.deploy(addresses.core, safeAddresses);
  logging && console.log('PCVGuardian deployed to: ', pcvGuardianNew.address);
  logging && console.log('PCVGuardian safeAddresses: ', safeAddresses);

  return {
    pcvGuardianNew
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
  // 1. Validate new PCVGuardian deployment and roles granted
  const core = contracts.core;
  const newPCVGuardian = contracts.pcvGuardianNew;

  const safeAddresses = await newPCVGuardian.getSafeAddresses();
  const expectedSafeAddresses = [
    '0xd51dba7a94e1adea403553a8235c302cebf41a3c',
    '0x4fcb1435fd42ce7ce7af3cb2e98289f79d2962b3',
    '0x98e5f5706897074a4664dd3a32eb80242d6e694b',
    '0x5b86887e171bae0c2c826e87e34df8d558c079b9',
    '0x2a188f9eb761f70ecea083ba6c2a40145078dfc2',
    '0xb0e731f036adfdec12da77c15aab0f90e8e45a0e',
    '0x24f663c69cd4b263cf5685a49013ff5f1c898d24',
    '0x5ae217de26f6ff5f481c6e10ec48b2cf2fc857c8',
    '0xe8633c49ace655eb4a8b720e6b12f09bd3a97812',
    '0xcd1ac0014e2ebd972f40f24df1694e6f528b2fd4',
    '0xc5bb8f0253776bec6ff450c2b40f092f7e7f5b57',
    '0xc4eac760c2c631ee0b064e39888b89158ff808b2',
    '0x2c47fef515d2c70f2427706999e158533f7cf090',
    '0x9aadffe00eae6d8e59bb4f7787c6b99388a6960d',
    '0xd2174d78637a40448112aa6b30f9b19e6cf9d1f9',
    '0x5dde9b4b14edf59cb23c1d4579b279846998205e'
  ];
  validateArraysEqual(safeAddresses, expectedSafeAddresses);

  // New PCV Guardian roles - validate granted
  expect(await core.hasRole(ethers.utils.id('GUARDIAN_ROLE'), newPCVGuardian.address)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), newPCVGuardian.address)).to.be.true;

  // Old PCV Guardian roles - validate revoked
  expect(await core.hasRole(ethers.utils.id('GUARDIAN_ROLE'), addresses.pcvGuardian)).to.be.false;
  expect(await core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.pcvGuardian)).to.be.false;

  // 2. Validate TribalCouncil role transfers
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
  expect(await core.getRoleAdmin(ethers.utils.id('RATE_LIMITED_MINTER_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('PARAMETER_ADMIN'))).to.be.equal(ROLE_ADMIN);

  // Non-major roles that previously had GOVERNOR as their admin
  expect(await core.getRoleAdmin(ethers.utils.id('ORACLE_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('SWAP_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('VOTIUM_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('RATE_LIMITED_MINTER_ADMIN'))).to.be.equal(ROLE_ADMIN);

  expect(await core.getRoleAdmin(ethers.utils.id('BALANCER_MANAGER_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('SWAP_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
};

/// Validate that the expected new TribeRoles have been created
const validateNewCouncilRoles = async (core: Contract) => {
  const ROLE_ADMIN = ethers.utils.id('ROLE_ADMIN');

  expect(await core.getRoleAdmin(ethers.utils.id('FUSE_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('FEI_MINT_ADMIN'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('PCV_MINOR_PARAM_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('PSM_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('PCV_SAFE_MOVER_ROLE'))).to.be.equal(ROLE_ADMIN);
  expect(await core.getRoleAdmin(ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
};

/// Validate that the relevant contract admins have been set to their expected values
const validateContractAdmins = async (contracts: NamedContracts) => {
  expect(await contracts.fuseGuardian.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('FUSE_ADMIN'));

  expect(await contracts.optimisticMinter.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('FEI_MINT_ADMIN'));
  expect(await contracts.pcvEquityMinter.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('FEI_MINT_ADMIN'));
  expect(await contracts.indexDelegator.CONTRACT_ADMIN_ROLE()).to.be.equal(
    ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN')
  );
  expect(await contracts.ethTokemakPCVDeposit.CONTRACT_ADMIN_ROLE()).to.be.equal(
    ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE')
  );
  expect(await contracts.uniswapPCVDeposit.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_MINOR_PARAM_ROLE'));

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
};

const validateCallingContractsHaveNewAdmin = async (core: Contract, addresses: NamedAddresses) => {
  // TRIBAL_CHIEF_ADMIN_ROLE : FUSE_ADMIN
  expect(await core.hasRole(ethers.utils.id('FUSE_ADMIN'), addresses.optimisticTimelock)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('FUSE_ADMIN'), addresses.tribalChiefSyncV2)).to.be.true;

  // GOVERNOR : FEI_MINT_ADMIN
  expect(await core.hasRole(ethers.utils.id('FEI_MINT_ADMIN'), addresses.feiDAOTimelock)).to.be.true;

  // GOVERNOR : PCV_MINOR_PARAM_ROLE
  expect(await core.hasRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.feiDAOTimelock)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.optimisticTimelock)).to.be.true;

  expect(await core.hasRole(ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE'), addresses.optimisticTimelock)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE'), addresses.feiDAOTimelock)).to.be.true;
};

const validateTribalCouncilRoles = async (core: Contract, tribalCouncilTimelockAddress: string) => {
  expect(await core.hasRole(ethers.utils.id('FUSE_ADMIN'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('FEI_MINT_ADMIN'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('ORACLE_ADMIN_ROLE'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PSM_ADMIN_ROLE'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('PCV_SAFE_MOVER_ROLE'), tribalCouncilTimelockAddress)).to.be.true;
  expect(await core.hasRole(ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE'), tribalCouncilTimelockAddress)).to.be.true;
};

export { deploy, setup, teardown, validate };
