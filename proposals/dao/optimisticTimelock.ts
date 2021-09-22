import { ethers } from "hardhat";
import { expect } from "chai";

async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Revoke TribalChief role from old timelock
 2. Grant TribalChief admin to new timelock
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    core,
    tribalChief,
    optimisticTimelock
  } = contracts;

  const {
    tribalChiefOptimisticTimelockAddress
  } = addresses;

  const role = await tribalChief.CONTRACT_ADMIN_ROLE();

  // 1.
  await core.revokeRole(role, tribalChiefOptimisticTimelockAddress);

  // 2. 
  await core.grantRole(role, optimisticTimelock.address);
}

async function teardown(addresses, oldContracts, contracts, logging) {}

async function validate(addresses, oldContracts, contracts) {
    const {
        core,
        tribalChief,
        optimisticTimelock
      } = contracts;
    
      const {
        tribalChiefOptimisticTimelockAddress,
        tribalChiefOptimisticMultisigAddress
      } = addresses;

  const proposerRole = await optimisticTimelock.PROPOSER_ROLE();
  const executorRole = await optimisticTimelock.EXECUTOR_ROLE();
  const role = await tribalChief.CONTRACT_ADMIN_ROLE();

  expect(await optimisticTimelock.hasRole(proposerRole, tribalChiefOptimisticMultisigAddress)).to.be.true;
  expect(await optimisticTimelock.hasRole(executorRole, tribalChiefOptimisticMultisigAddress)).to.be.true;
 
  expect(await core.hasRole(role, optimisticTimelock.address)).to.be.true;
  expect(await core.hasRole(role, tribalChiefOptimisticTimelockAddress)).to.be.false;
}

module.exports = {
  setup, run, teardown, validate
};
