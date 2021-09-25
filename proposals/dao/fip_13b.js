import { expect } from 'hardhat';
import { BN, expectApprox } from '../../test/helpers';

const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Mint 4m FEI
 2. Transfer 1m FEI to Fuse Pool 9
 3. Deposit Fuse Pool 9
 4. Transfer 1m FEI to Fuse Pool 25
 5. Deposit Fuse Pool 25
 6. Transfer 1m FEI to Fuse Pool 26
 7. Deposit Fuse Pool 26
 8. Transfer 1m FEI to Fuse Pool 27
 9. Deposit Fuse Pool 27
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const { timelockAddress } = addresses;

  const { rariPool9FeiPCVDeposit, rariPool25FeiPCVDeposit, rariPool26FeiPCVDeposit, rariPool27FeiPCVDeposit, fei } =
    contracts;

  // 1. Mint 4M FEI
  const totalFei = `4000000${e18}`;
  const millionFei = `1000000${e18}`;

  await fei.mint(timelockAddress, totalFei);

  // 2. Transfer to Fuse Deposit
  await fei.transfer(rariPool9FeiPCVDeposit.address, millionFei);

  // 3. deposit funds
  await rariPool9FeiPCVDeposit.deposit();

  // 4. Transfer to Fuse Deposit
  await fei.transfer(rariPool25FeiPCVDeposit.address, millionFei);

  // 5. deposit funds
  await rariPool25FeiPCVDeposit.deposit();

  // 6. Transfer to Fuse Deposit
  await fei.transfer(rariPool26FeiPCVDeposit.address, millionFei);

  // 7. deposit funds
  await rariPool26FeiPCVDeposit.deposit();

  // 8. Transfer to Fuse Deposit
  await fei.transfer(rariPool27FeiPCVDeposit.address, millionFei);

  // 9. deposit funds
  await rariPool27FeiPCVDeposit.deposit();
}

async function teardown(addresses, oldContracts, contracts, logging) {}

async function validate(addresses, oldContracts, contracts) {
  const { rariPool9FeiPCVDeposit, rariPool25FeiPCVDeposit, rariPool26FeiPCVDeposit, rariPool27FeiPCVDeposit } =
    contracts;

  const { feiAddress, rariPool9FeiAddress, rariPool25FeiAddress, rariPool26FeiAddress, rariPool27FeiAddress } =
    addresses;

  const millionFei = new BN(`1000000${e18}`);
  expectApprox(await rariPool9FeiPCVDeposit.balance(), millionFei);
  expectApprox(await rariPool25FeiPCVDeposit.balance(), millionFei);
  expectApprox(await rariPool26FeiPCVDeposit.balance(), millionFei);
  expectApprox(await rariPool27FeiPCVDeposit.balance(), millionFei);

  expect(await rariPool9FeiPCVDeposit.token()).to.be.equal(feiAddress);
  expect(await rariPool25FeiPCVDeposit.token()).to.be.equal(feiAddress);
  expect(await rariPool26FeiPCVDeposit.token()).to.be.equal(feiAddress);
  expect(await rariPool27FeiPCVDeposit.token()).to.be.equal(feiAddress);

  expect(await rariPool9FeiPCVDeposit.cToken()).to.be.equal(rariPool9FeiAddress);
  expect(await rariPool25FeiPCVDeposit.cToken()).to.be.equal(rariPool25FeiAddress);
  expect(await rariPool26FeiPCVDeposit.cToken()).to.be.equal(rariPool26FeiAddress);
  expect(await rariPool27FeiPCVDeposit.cToken()).to.be.equal(rariPool27FeiAddress);
}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
