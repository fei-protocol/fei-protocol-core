import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { Fei, LinearTokenTimelock, LinearTokenTimelock__factory, Tribe } from '@custom-types/contracts';
import { getImpersonatedSigner } from '@test/helpers';

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
  6 - set pending beneficary back to guardian for dust collection
  7 - update collateralization oracle?
*/

const fipNumber = '9001'; // Change me!
const OLD_TIMELOCK_ADDRESS = '0x7D809969f6A04777F0A87FF94B57E56078E5fE0F';
const GUARDIAN_ADDRESS = '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775';
const FEI_TRIBE_LP_ADDRESS = '0x9928e4046d7c6513326cCeA028cD3e7a91c7590A';

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
  if (!addresses.timelock) throw new Error('Timelock address was not set!');

  // Change beneficiary of existing timelock from guardian multisig to timelock
  // Old timelock @ 0x7D809969f6A04777F0A87FF94B57E56078E5fE0F
  const oldTImelock = await ethers.getContractAt(
    'LinearTokenTimelock',
    OLD_TIMELOCK_ADDRESS,
    await getImpersonatedSigner(GUARDIAN_ADDRESS)
  );
  await oldTImelock.setPendingBeneficiary(addresses.timelock);

  // Make sure the pending beneficiary is set to the timelock
  const pendingBeneficiary = await oldTImelock.pendingBeneficiary();
  expect(pendingBeneficiary).to.equal(addresses.timelock);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Change beneficiary of existing timelock from timelock back to guardian multisig
  const oldTImelock = await ethers.getContractAt(
    'LinearTokenTimelock',
    OLD_TIMELOCK_ADDRESS,
    await getImpersonatedSigner(GUARDIAN_ADDRESS)
  );
  await oldTImelock.setPendingBeneficiary(addresses.timelock);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const oldTImelock = await ethers.getContractAt(
    'LinearTokenTimelock',
    OLD_TIMELOCK_ADDRESS,
    await getImpersonatedSigner(GUARDIAN_ADDRESS)
  );

  // Beneficiary of old timelock should be the guardian multisig
  expect(await oldTImelock.beneficiary()).to.equal(GUARDIAN_ADDRESS);

  // Pending beneficiary of old timelock should be 0x0
  expect(await oldTImelock.pendingBeneficiary()).to.equal(ethers.constants.AddressZero);

  // The old timelock shouldn't have any LP left
  const FEI_TRIBE_LP = await ethers.getContractAt('ERC20', FEI_TRIBE_LP_ADDRESS);
  expect(await FEI_TRIBE_LP.balanceOf(OLD_TIMELOCK_ADDRESS)).to.equal(ethers.constants.Zero);

  // The old timelock shouldn't have any trip or fei left
  expect(await (contracts.tribe as Tribe).balanceOf(OLD_TIMELOCK_ADDRESS)).to.equal(ethers.constants.Zero);
  expect(await (contracts.fei as Fei).balanceOf(OLD_TIMELOCK_ADDRESS)).to.equal(ethers.constants.Zero);

  // The new timelocks should have the tribe and the fei
  expect(await (contracts.tribe as Tribe).balanceOf(addresses.feiGovernanceTimelock)).to.not.equal(
    ethers.constants.Zero
  );
  expect(await (contracts.fei as Fei).balanceOf(addresses.feiGovernanceTimelock)).to.not.equal(ethers.constants.Zero);
  expect(await (contracts.tribe as Tribe).balanceOf(addresses.tribeGovernanceTimelock)).to.be.gt(
    ethers.utils.parseEther('50000000')
  ); // 50 million tribe
  expect(await (contracts.fei as Fei).balanceOf(addresses.tribeGovernanceTimelock)).to.be.gt(
    ethers.utils.parseEther('50000000')
  ); // 50 million fei

  // The beneficiary of the new timelocks should be the guardian multisig
  expect(await contracts.tribeGovernanceTimelock.beneficiary()).to.equal(GUARDIAN_ADDRESS);
  expect(await contracts.feiGovernanceTimelock.beneficiary()).to.equal(GUARDIAN_ADDRESS);

  // Pending beneficiaries of the new timelocks should be 0x0
  expect(await contracts.tribeGovernanceTimelock.pendingBeneficiary()).to.equal(ethers.constants.AddressZero);
  expect(await contracts.feiGovernanceTimelock.pendingBeneficiary()).to.equal(ethers.constants.AddressZero);
};

export { deploy, setup, teardown, validate };
