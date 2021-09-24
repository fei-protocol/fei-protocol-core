import { expect } from "chai";
import hre, { ethers } from "hardhat";

const e18 = ethers.constants.WeiPerEther;

async function setup(addresses, oldContracts, contracts, logging) {}

async function run(addresses, oldContracts, contracts, logging = false) {}

async function teardown(addresses, oldContracts, contracts, logging) {
  const {
    optimisticTimelockAddress
  } = addresses;

  const {
    rariPool8Comptroller,
    rariPool8Dai,
    rariPool8Tribe,
    rariPool8Eth,
    rariPool8Fei
  } = contracts;

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [optimisticTimelockAddress],
  });

  await (await ethers.getSigners())[0].sendTransaction({
    to: optimisticTimelockAddress,
    value: ethers.utils.parseEther("10.0")
  });

  await rariPool8Comptroller._acceptAdmin({from: optimisticTimelockAddress});
  await rariPool8Dai._acceptAdmin({from: optimisticTimelockAddress});
  await rariPool8Tribe._acceptAdmin({from: optimisticTimelockAddress});
  await rariPool8Eth._acceptAdmin({from: optimisticTimelockAddress});
  await rariPool8Fei._acceptAdmin({from: optimisticTimelockAddress});
}

async function validate(addresses, oldContracts, contracts) {
  const {
    rariPool8Comptroller,
    fei,
    rariPool8Dai,
    rariPool8Tribe,
    rariPool8Eth,
    rariPool8Fei
  } = contracts;

  const {
      optimisticTimelockAddress
  } = addresses;

  // Borrow disabled
  expect(await rariPool8Comptroller.borrowGuardianPaused(rariPool8Tribe.address)).to.be.equal(true);
  
  // minted FEI
  // 1M from before, 50M from proposal
  expect((await fei.balanceOf(optimisticTimelockAddress)).toString()).to.be.equal(e18.mul(51_000_000).toString());
  
  // admin transfer
  expect(await rariPool8Comptroller.admin()).to.be.equal(optimisticTimelockAddress);
  expect(await rariPool8Dai.admin()).to.be.equal(optimisticTimelockAddress);
  expect(await rariPool8Tribe.admin()).to.be.equal(optimisticTimelockAddress);
  expect(await rariPool8Eth.admin()).to.be.equal(optimisticTimelockAddress);
  expect(await rariPool8Fei.admin()).to.be.equal(optimisticTimelockAddress);
}

module.exports = {
  setup, run, teardown, validate
};
