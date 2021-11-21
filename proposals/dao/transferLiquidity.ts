import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '../../types/types';

/*

DAO Proposal #9001

Description: Remove FEI Labs IDO Liquidity from Uniswap

Steps:
  0 - deploy new contracts:
      - tribe timelock
      - fei timelock
      - helper contract
  1 - accept beneficiary for old timelock
  2 - call releaseMax to Fei Labs multisig
  3 - call unlockLiquidity on old time lock
  4 - call releaseMax to helper contract
  5 - call doLiquidityTransfer on helper contract
  6 - update collateralization oracle?
*/

const fipNumber = '9001'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  if (!addresses.core || !addresses.fei || !addresses.tribe || !addresses.guardian) {
    throw new Error('An address was not set! (require: core, fei, tribe, guardian)');
  }

  const governanceTimelockFactory = await ethers.getContractFactory('GovernanceTimelock');

  const feiGovernanceTimelock = await governanceTimelockFactory.deploy(addresses.core, addresses.fei);
  const tribeGovernanceTimelock = await governanceTimelockFactory.deploy(addresses.core, addresses.tribe);

  await Promise.all([feiGovernanceTimelock.deployTransaction.wait(), tribeGovernanceTimelock.deployTransaction.wait()]);

  return {
    feiGovernanceTimelock,
    tribeGovernanceTimelock
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
