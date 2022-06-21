import { FuseFixer__factory, PCVGuardian } from '@custom-types/contracts';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import hre from 'hardhat';

const fipNumber = 'tip_112';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const fuseFixerFactory = (await hre.ethers.getContractFactory('FuseFixer')) as FuseFixer__factory;
  const fuseFixer = await fuseFixerFactory.deploy(addresses.core);
  await fuseFixer.deployTransaction.wait();

  return { fuseFixer };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip ${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Ensure that the fuse fixer is a safe address
  const pcvGuardian = contracts.pcvGuardianNew as PCVGuardian;
  const isSafeAddress = await pcvGuardian.isSafeAddress(contracts.fuseFixer.address);

  if (!isSafeAddress) {
    throw new Error(`Fuse fixer (${contracts.fuseFixer.address}) is not a safe address`);
  }
};

export { deploy, setup, teardown, validate };
