import hre, { ethers } from 'hardhat';
import { expect } from 'chai';

async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Set pending timelock admin 
 2. Accept admin from new Fei DAO
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const { timelock, feiDAO } = contracts;

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelock.address]
  });

  const timelockSigner = await ethers.getSigner(timelock.address);

  await (await timelock.connect(timelockSigner)).setPendingAdmin(feiDAO.address);

  await feiDAO.__acceptAdmin();
}

async function teardown(addresses, oldContracts, contracts, logging) {}

async function validate(addresses, oldContracts, contracts) {
  const { timelock, feiDAO } = contracts;

  expect(await timelock.admin()).to.be.equal(feiDAO.address);
}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
