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

const toBN = ethers.BigNumber.from;

/*

Verify Rari Proposal 

*/

let initialFuseMultisigUSDC: BigNumber;
let initialFuseMultisigDAI: BigNumber;

// Expected Fuse multisig asset gains
const EXPECTED_USDC_GAIN = toBN('336235000000');
const EXPECTED_DAI_GAIN = toBN('94218000000000000000000');

const DAO_TIMELOCK_BURNER_ADDRESS = '0x6F6580285a63f1e886548458f427f8695BA1a563';

const fipNumber = 'verify_rari_proposal';

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
  initialFuseMultisigUSDC = await contracts.usdc.balanceOf(addresses.fuseMultisig);
  initialFuseMultisigDAI = await contracts.dai.balanceOf(addresses.fuseMultisig);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Verify Fuse multisig USDC gain
  const usdcGain = (await contracts.usdc.balanceOf(addresses.fuseMultisig)).sub(initialFuseMultisigUSDC);
  console.log('USDC gain: ', usdcGain.toString());
  expect(usdcGain).to.be.bignumber.greaterThan(EXPECTED_USDC_GAIN);

  // 2. Verify Fuse multisig DAI gain
  const daiGain = (await contracts.dai.balanceOf(addresses.fuseMultisig)).sub(initialFuseMultisigDAI);
  console.log('daiGain: ', daiGain.toString());
  expect(daiGain).to.be.bignumber.greaterThan(EXPECTED_DAI_GAIN);

  // 3. Verify Rari timelock admin set to DAOTimelockBurne
  expect(await contracts.rariTimelock.admin()).to.equal(DAO_TIMELOCK_BURNER_ADDRESS);
};

export { deploy, setup, teardown, validate };
