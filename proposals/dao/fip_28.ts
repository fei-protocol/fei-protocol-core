import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc } from '../../test/integration/setup/types';

const e18 = ethers.constants.WeiPerEther;

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { optimisticTimelock } = addresses;

  const { rariPool8Comptroller, rariPool8Dai, rariPool8Tribe, rariPool8Eth, rariPool8Fei } = contracts;

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [optimisticTimelock]
  });

  await (
    await ethers.getSigners()
  )[0].sendTransaction({
    to: optimisticTimelock,
    value: ethers.utils.parseEther('10.0')
  });

  const optimisticTimelockSigner = await ethers.getSigner(optimisticTimelock);

  await rariPool8Comptroller.connect(optimisticTimelockSigner)._acceptAdmin();
  await rariPool8Dai.connect(optimisticTimelockSigner)._acceptAdmin();
  await rariPool8Tribe.connect(optimisticTimelockSigner)._acceptAdmin();
  await rariPool8Eth.connect(optimisticTimelockSigner)._acceptAdmin();
  await rariPool8Fei.connect(optimisticTimelockSigner)._acceptAdmin();
};

const validate = async (addresses, oldContracts, contracts) => {
  const {
    rariPool8Comptroller,
    fei,
    rariPool8Dai,
    rariPool8Tribe,
    rariPool8Eth,
    rariPool8Fei,
    rariPool22FeiPCVDeposit
  } = contracts;

  const { optimisticTimelock } = addresses;

  // Borrow disabled
  expect(await rariPool8Comptroller.borrowGuardianPaused(rariPool8Tribe.address)).to.be.equal(true);

  // minted FEI
  // 1M from before, 50M from proposal
  expect((await fei.balanceOf(optimisticTimelock)).toString()).to.be.equal(e18.mul(51_000_000).toString());

  expect((await rariPool22FeiPCVDeposit.balance()).toString()).to.be.equal(e18.mul(1_000_000).toString());

  // admin transfer
  expect(await rariPool8Comptroller.admin()).to.be.equal(optimisticTimelock);
  expect(await rariPool8Dai.admin()).to.be.equal(optimisticTimelock);
  expect(await rariPool8Tribe.admin()).to.be.equal(optimisticTimelock);
  expect(await rariPool8Eth.admin()).to.be.equal(optimisticTimelock);
  expect(await rariPool8Fei.admin()).to.be.equal(optimisticTimelock);
};

module.exports = {
  setup,
  run,
  teardown,
  validate
};
