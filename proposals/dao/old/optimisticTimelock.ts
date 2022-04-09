import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { time } from '@test/helpers';
import { RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '@custom-types/types';

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log('No actions to complete in setup.');
};

/*
 1. Revoke TribalChief role from old timelock
 2. Grant TribalChief admin to new timelock
*/
const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  const { core, tribalChief, optimisticTimelock } = contracts;

  const { tribalChiefOptimisticTimelock } = addresses;

  const role = await tribalChief.CONTRACT_ADMIN_ROLE();

  // 1.
  await core.revokeRole(role, tribalChiefOptimisticTimelock);

  // 2.
  await core.grantRole(role, optimisticTimelock.address);
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { tribalChiefOptimisticTimelock } = contracts;

  const { tribalChiefOptimisticMultisig } = addresses;

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [tribalChiefOptimisticMultisig]
  });

  await time.increase('1000000');

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [tribalChiefOptimisticMultisig]
  });

  await tribalChiefOptimisticTimelock
    .connect(await ethers.getSigner(tribalChiefOptimisticMultisig))
    .executeTransaction(
      '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
      '0',
      'transfer(address,uint256)',
      '0x000000000000000000000000bc9c084a12678ef5b516561df902fdc426d9548300000000000000000000000000000000000000000000d3c21bcecceda1000000',
      '1632873600'
    );
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts): Promise<void> => {
  const { core, tribalChief, optimisticTimelock, fei } = contracts;

  const tribalChiefOptimisticTimelock: string = addresses.tribalChiefOptimisticTimelock;
  const tribalChiefOptimisticMultisig: string = addresses.tribalChiefOptimisticMultisig;

  expect((await fei.balanceOf(tribalChiefOptimisticTimelock)).toString()).to.be.equal('0');
  expect((await fei.balanceOf(optimisticTimelock.address)).toString()).to.be.equal(
    ethers.constants.WeiPerEther.mul(1_000_000).toString()
  );

  const proposerRole = await optimisticTimelock.PROPOSER_ROLE();
  const executorRole = await optimisticTimelock.EXECUTOR_ROLE();
  const role = await tribalChief.CONTRACT_ADMIN_ROLE();

  expect(await optimisticTimelock.hasRole(proposerRole, tribalChiefOptimisticMultisig)).to.be.true;
  expect(await optimisticTimelock.hasRole(executorRole, tribalChiefOptimisticMultisig)).to.be.true;

  expect(await core.hasRole(role, optimisticTimelock.address)).to.be.true;
  expect(await core.hasRole(role, tribalChiefOptimisticTimelock)).to.be.false;
};

module.exports = {
  setup,
  run,
  teardown,
  validate
};
