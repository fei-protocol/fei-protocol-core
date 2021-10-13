import { expect } from 'chai';
import { RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc } from '@custom-types/types';
import { getImpersonatedSigner, increaseTime } from '@test/helpers';

/*

OA Proposal feiRariStaking

Description:

Steps:
  1 - Set pending Unitroller Impl
  2 - Become Unitroller Impl
  3 - Set Rewards Distributor
  4 - Add StakingTokenWraper
  5 - Initialize StakingTokenWrapper
*/

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  await increaseTime(500000);
};

const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  const { optimisticTimelock, rariPool8Comptroller, stakingTokenWrapperRari } = contracts;
  const { tribalChiefOptimisticMultisig, tribalChief } = addresses;

  const oaSigner = await getImpersonatedSigner(tribalChiefOptimisticMultisig);

  await optimisticTimelock
    .connect(oaSigner)
    .execute(
      rariPool8Comptroller.address,
      0,
      '0xe992a041000000000000000000000000e16db319d9da7ce40b666dd2e365a4b8b3c18217',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x3b8bd9479db83f492761601db65f2de2fd9fbac8304f45398fc31e3387d34d7e'
    );

  await optimisticTimelock
    .connect(oaSigner)
    .execute(
      tribalChief,
      0,
      '0x47a2dcae00000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000d81be1b9a7895c996704a8dda794bba4454eeb9000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002710',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x8302a6506ea19f4a4e1745122bf10dcafe35f0b2711299a53d0b78d1808cb70a'
    );

  await optimisticTimelock
    .connect(oaSigner)
    .executeBatch(
      ['0xe16db319d9da7ce40b666dd2e365a4b8b3c18217', rariPool8Comptroller.address],
      [0, 0],
      [
        '0x1d504dc6000000000000000000000000c54172e34046c1653d1920d40333dd358c7a1af4',
        '0xb9b5b15300000000000000000000000073f16f0c0cd1a078a54894974c5c054d8dc1a3d7'
      ],
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1'
    );

  await stakingTokenWrapperRari.init(3);
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

const validate = async (addresses, oldContracts, contracts) => {
  const { rariPool8Comptroller, tribalChief, stakingTokenWrapperRari, tribe } = contracts;
  const { rariRewardsDistributorDelegator } = addresses;

  expect(await rariPool8Comptroller.comptrollerImplementation()).to.be.equal(
    '0xE16DB319d9dA7Ce40b666DD2E365a4b8B3C18217'
  );
  expect(await rariPool8Comptroller.rewardsDistributors(0)).to.be.equal(rariRewardsDistributorDelegator);
  expect(await tribalChief.stakedToken(3)).to.be.equal(stakingTokenWrapperRari.address);
  expect(await tribalChief.numPools()).to.be.equal('4');
  expect(await tribalChief.totalAllocPoint()).to.be.equal('3100');
  expect((await tribalChief.poolInfo(3)).allocPoint).to.be.equal('1000');
  expect((await stakingTokenWrapperRari.pid()).toString()).to.be.equal('3');

  await stakingTokenWrapperRari.harvest();
  expect((await tribe.balanceOf(rariRewardsDistributorDelegator)).toString()).to.be.not.equal('0');
};

export { setup, run, teardown, validate };
