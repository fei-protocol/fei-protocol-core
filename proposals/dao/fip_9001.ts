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

DAO Proposal #9001

Description:

Steps:
  1 -
  2 -
  3 -

*/

const fipNumber = '9001'; // Change me!
const DELEGATE_AAVE = '0x0000000000000000000000000000000000000000';
const DELEGATE_ANGLE = '0x0000000000000000000000000000000000000000';
const DELEGATE_COMP = '0x0000000000000000000000000000000000000000';
const DELEGATE_CVX = '0x0000000000000000000000000000000000000000';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  if (!addresses.core) {
    throw new Error('An environment variable contract address is not set');
  }

  const moverFactory = await ethers.getContractFactory('ERC20PermissionlessMover');
  const permissionlessPcvMover = await moverFactory.deploy(addresses.core);
  await permissionlessPcvMover.deployTransaction.wait();
  logging && console.log('permissionlessPcvMover: ', permissionlessPcvMover.address);

  const aaveDelegatorFactory = await ethers.getContractFactory('AaveDelegatorPCVDeposit');
  const aaveDelegatorPCVDeposit = await aaveDelegatorFactory.deploy(addresses.core, DELEGATE_AAVE);
  await aaveDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('aaveDelegatorPCVDeposit: ', aaveDelegatorPCVDeposit.address);

  const delegatorFactory = await ethers.getContractFactory('DelegatorPCVDeposit');
  const angleDelegatorPCVDeposit = await delegatorFactory.deploy(addresses.core, addresses.angle, DELEGATE_ANGLE);
  await angleDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('angleDelegatorPCVDeposit: ', angleDelegatorPCVDeposit.address);

  const compDelegatorPCVDeposit = await delegatorFactory.deploy(addresses.core, addresses.comp, DELEGATE_COMP);
  await compDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('compDelegatorPCVDeposit: ', compDelegatorPCVDeposit.address);

  const convexDelegatorFactory = await ethers.getContractFactory('ConvexDelegatorPCVDeposit');
  const convexDelegatorPCVDeposit = await convexDelegatorFactory.deploy(addresses.core, DELEGATE_CVX);
  await convexDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('convexDelegatorPCVDeposit: ', convexDelegatorPCVDeposit.address);

  return {
    aaveDelegatorPCVDeposit,
    angleDelegatorPCVDeposit,
    compDelegatorPCVDeposit,
    convexDelegatorPCVDeposit,
    permissionlessPcvMover
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
  // Validate delegatees
  expect(await contracts.aaveDelegatorPCVDeposit.delegate()).to.be.equal(DELEGATE_AAVE);
  expect(await contracts.angleDelegatorPCVDeposit.delegate()).to.be.equal(DELEGATE_ANGLE);
  expect(await contracts.compDelegatorPCVDeposit.delegate()).to.be.equal(DELEGATE_COMP);
  expect(await contracts.convexDelegatorPCVDeposit.delegate()).to.be.equal(DELEGATE_CVX);

  // TODO: additional checks
  expect(false).to.be.true;
};

export { deploy, setup, teardown, validate };
