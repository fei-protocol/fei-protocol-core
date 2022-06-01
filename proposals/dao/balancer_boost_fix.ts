import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, overwriteChainlinkAggregator, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

const e18 = '000000000000000000';
const fipNumber = 'balancer_boost_fix';
let pcvStatsBefore;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy balancer gauge staker implementation
  const balancerGaugeStakerFactory = await ethers.getContractFactory('BalancerGaugeStaker');
  const balancerGaugeStakerImpl = await balancerGaugeStakerFactory.deploy(
    addresses.core, // address _core
    addresses.balancerGaugeController, // address _gaugeController
    addresses.balancerMinter, // address _balancerMinter
    addresses.balancerVotingEscrowDelegation // address _votingEscrowDelegation
  );
  await balancerGaugeStakerImpl.deployTransaction.wait();
  logging && console.log('balancerGaugeStakerImpl: ', balancerGaugeStakerImpl.address);

  return {
    balancerGaugeStakerImpl
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No setup for ${fipNumber}.`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // check approve for all (hardcoded by Balancer team)
  expect(
    await contracts.balancerVotingEscrowDelegation.isApprovedForAll(
      contracts.veBalDelegatorPCVDeposit.address,
      contracts.balancerGaugeStaker.address
    )
  ).to.be.true;

  // check proxy's state
  expect(await contracts.balancerGaugeStaker.core()).to.be.equal(contracts.core.address);
  expect(await contracts.balancerGaugeStaker.gaugeController()).to.be.equal(contracts.balancerGaugeController.address);
  expect(await contracts.balancerGaugeStaker.balancerMinter()).to.be.equal(contracts.balancerMinter.address);
  expect(await contracts.balancerGaugeStaker.votingEscrowDelegation()).to.be.equal(
    contracts.balancerVotingEscrowDelegation.address
  );

  // check boost delegation
  const expectedMinBoost = '100000000000000000000000'; // should be 109k with 18 decimals
  expect(
    await contracts.balancerVotingEscrowDelegation.delegated_boost(contracts.veBalDelegatorPCVDeposit.address)
  ).to.be.at.least(expectedMinBoost);
  expect(
    await contracts.balancerVotingEscrowDelegation.received_boost(contracts.balancerGaugeStaker.address)
  ).to.be.at.least(expectedMinBoost);

  // token id is uint256(delegatorAddress << 96 + boostId), and boostId = 0 (as chosen in proposal description)
  const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b2000000000000000000000000';
  expect(await contracts.balancerVotingEscrowDelegation.token_boost(tokenId)).to.be.at.least(expectedMinBoost);
  expect(await contracts.balancerVotingEscrowDelegation.token_expiry(tokenId)).to.equal('1672272000');
  expect(await contracts.balancerVotingEscrowDelegation.token_cancel_time(tokenId)).to.equal('1656547200');
};

export { deploy, setup, teardown, validate };
