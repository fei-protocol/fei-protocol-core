import hre, { ethers } from "hardhat";
import { expect } from "chai";
const { time } = require('../../test/helpers');

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

async function teardown(addresses, oldContracts, contracts, logging) {

    const {
        tribalChiefOptimisticTimelock
    } = contracts;

    const {
        tribalChiefOptimisticMultisigAddress
    } = addresses;
    
    await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [tribalChiefOptimisticMultisigAddress],
    });

    await tribalChiefOptimisticTimelock.queueTransaction(
        '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
        '0',
        'transfer(address,uint256)',
        '0x000000000000000000000000bc9c084a12678ef5b516561df902fdc426d9548300000000000000000000000000000000000000000000d3c21bcecceda1000000',
        '1632873600',
        {from: tribalChiefOptimisticMultisigAddress}
    );

    await time.increase('1000000');

    await tribalChiefOptimisticTimelock.executeTransaction(
        '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
        '0',
        'transfer(address,uint256)',
        '0x000000000000000000000000bc9c084a12678ef5b516561df902fdc426d9548300000000000000000000000000000000000000000000d3c21bcecceda1000000',
        '1632873600',
        {from: tribalChiefOptimisticMultisigAddress}
    );
}

async function validate(addresses, oldContracts, contracts) {
    const {
        core,
        tribalChief,
        optimisticTimelock,
        fei
      } = contracts;
    
      const {
        tribalChiefOptimisticTimelockAddress,
        tribalChiefOptimisticMultisigAddress
      } = addresses;

  expect((await fei.balanceOf(tribalChiefOptimisticTimelockAddress)).toString()).to.be.equal('0')
  expect((await fei.balanceOf(optimisticTimelock.address)).toString()).to.be.equal(ethers.constants.WeiPerEther.mul(1_000_000).toString())

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
