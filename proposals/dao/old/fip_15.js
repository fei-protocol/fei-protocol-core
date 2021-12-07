/* eslint-disable max-len */
/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
const { ethers } = require('hardhat');
const hre = require('hardhat');
const { BN, expect } = require('../../test/helpers');

const e18 = '000000000000000000';
const twoMillionTribe = `2000000${e18}`;
const allocPoints = 1000;
const oneMultiplier = '10000';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// We will drip 4 million tribe per week
const dripAmount = new BN(4000000).mul(new BN(10).pow(new BN(18)));

const defaultPoolRewardObject = [
  {
    lockLength: 0,
    rewardMultiplier: oneMultiplier
  }
];

async function setup(addresses, oldContracts, contracts, logging) {
  const { timelockAddress } = addresses;

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });
}

// 1. Withdraw TRIBE from old dripper
// 2. Allocate TRIBE to new dripper
// 3. Allocate first drip to TribalChief
// 4. Add FEI-TRIBE pair address
// 5. Add curve metapool address
// 6. Create TribalChief admin role
// 7. Grant TribalChief admin role to optimistic timelock
// 8. Send 7000 TRIBE to OA multisig
// 9. Revoke minter from FeiRewardsDistributorAddress
async function run(addresses, oldContracts, contracts, logging = false) {
  const { tribalChief, tribe, core, erc20Dripper } = contracts;
  const {
    timelockAddress,
    feiRewardsDistributorAddress,
    feiTribePairAddress,
    curve3MetapoolAddress,
    tribalChiefOptimisticTimelockAddress,
    tribalChiefOptimisticMultisigAddress
  } = addresses;

  // we should subtract 2 million off this number to leave 2 million tribe in the DAO
  const tribeBalanceToMigrate = await tribe.balanceOf(feiRewardsDistributorAddress);

  // 1. Withdraw TRIBE from old dripper
  const governorWithdrawTribeAbi = ['function governorWithdrawTribe(uint256 amount)'];
  const governorWithdrawTribeInterface = new ethers.utils.Interface(governorWithdrawTribeAbi);
  const encodedGovernorWithdrawTribe = governorWithdrawTribeInterface.encodeFunctionData('governorWithdrawTribe', [
    tribeBalanceToMigrate.toString()
  ]);
  const adminSigner = ethers.provider.getSigner(timelockAddress);
  await (
    await adminSigner.sendTransaction({ data: encodedGovernorWithdrawTribe, to: feiRewardsDistributorAddress })
  ).wait();

  const tribeBalanceToAllocate = tribeBalanceToMigrate.sub(new BN(twoMillionTribe)).sub(dripAmount);

  // 2. Allocate TRIBE to new dripper
  await core.allocateTribe(erc20Dripper.address, tribeBalanceToAllocate);
  // 3. Allocate first drip to TribalChief
  await core.allocateTribe(tribalChief.address, dripAmount);

  // 4. create the pool for fei/tribe LP tokens
  await tribalChief.add(allocPoints, feiTribePairAddress, ZERO_ADDRESS, defaultPoolRewardObject);

  // 5. create the pool for fei/curve3Metapool LP tokens
  await tribalChief.add(allocPoints, curve3MetapoolAddress, ZERO_ADDRESS, defaultPoolRewardObject);

  const role = await tribalChief.CONTRACT_ADMIN_ROLE();

  // 6. Create TribalChief admin role
  await core.createRole(role, await core.GOVERN_ROLE());

  // 7. Grant TribalChief admin role to optimistic timelock
  await core.grantRole(role, tribalChiefOptimisticTimelockAddress);

  // 8. Send 7000 TRIBE to OA multisig
  await core.allocateTribe(tribalChiefOptimisticMultisigAddress, `7000${e18}`);

  // 9. Revoke minter from FeiRewardsDistributorAddress
  await core.revokeMinter(feiRewardsDistributorAddress);
}

async function teardown(addresses, oldContracts, contracts, logging) {}

// the purpose of this function is not to unit test things,
// but to just log out what just happened
// this function will log out false if anything incorrect happened during the run or deploy
async function validate(addresses, oldContracts, contracts, logging) {
  const {
    feiRewardsDistributorAddress,
    feiTribePairAddress,
    curve3MetapoolAddress,
    tribalChiefOptimisticTimelockAddress,
    coreAddress,
    timelockAddress
  } = addresses;
  const { tribalChief, tribalChiefImpl, tribe, core, proxyAdmin } = contracts;

  expect((await tribe.balanceOf(feiRewardsDistributorAddress)).toString()).to.be.equal('0');
  expect((await tribalChief.totalAllocPoint()).toString()).to.be.equal((allocPoints * 2).toString());
  expect((await tribalChief.numPools()).toString()).to.be.equal('2');
  expect(await tribalChief.stakedToken(0)).to.be.equal(feiTribePairAddress);
  expect(await tribalChief.stakedToken(1)).to.be.equal(curve3MetapoolAddress);

  expect(await tribalChief.isContractAdmin(tribalChiefOptimisticTimelockAddress)).to.be.true;
  expect(await tribalChief.core()).to.be.equal(coreAddress);
  expect(await tribalChief.tribe()).to.be.equal(tribe.address);
  expect(await tribalChief.tribePerBlock()).to.be.bignumber.equal(`75${e18}`);
  expect(await tribalChief.CONTRACT_ADMIN_ROLE()).to.be.not.equal(await core.GOVERN_ROLE());

  expect(await proxyAdmin.owner()).to.be.equal(timelockAddress);
  expect(await proxyAdmin.getProxyImplementation(tribalChief.address)).to.be.equal(tribalChiefImpl.address);
  expect(await proxyAdmin.getProxyAdmin(tribalChief.address)).to.be.equal(proxyAdmin.address);
}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
