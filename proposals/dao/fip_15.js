/* eslint-disable max-len */
/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
const { ethers } = require('hardhat');
const hre = require('hardhat');
const { BN, expect } = require('../../test/helpers');

const e18 = '000000000000000000';
const seventyFiveTribe = `75${e18}`;
const twoMillionTribe = `2000000${e18}`;
const allocPoints = 1000;
const oneMultiplier = '10000';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const defaultPoolRewardObject = [
  {
    lockLength: 0,
    rewardMultiplier: oneMultiplier,
  },
];

async function setup(addresses, oldContracts, contracts, logging) {
  const { timelockAddress } = addresses;

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress],
  });
}

// assert that state changes correctly
// add the first couple of pools to the tribal chief
// add pool for curve staking, fei/tribe on univ2, rari tribe pool
// add tests to the validate function. Just test things like balances, allocation points, etc
async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    stakingTokenWrapper, tribalChief, tribe, core 
  } = contracts;
  const {
    timelockAddress, feiRewardsDistributorAddress, feiTribePairAddress, curve3MetapoolAddress 
  } = addresses;

  // we should subtract 2 million off this number to leave 2 million tribe in the DAO
  const tribeBalanceToMigrate = await tribe.balanceOf(feiRewardsDistributorAddress);

  const governorWithdrawTribeAbi = ['function governorWithdrawTribe(uint256 amount)'];
  const governorWithdrawTribeInterface = new ethers.utils.Interface(governorWithdrawTribeAbi);
  const encodedGovernorWithdrawTribe = governorWithdrawTribeInterface.encodeFunctionData('governorWithdrawTribe', [tribeBalanceToMigrate.toString()]);
  const adminSigner = ethers.provider.getSigner(timelockAddress);
  await (
    await adminSigner.sendTransaction({ data: encodedGovernorWithdrawTribe, to: feiRewardsDistributorAddress })
  ).wait();
    
  const tribeBalanceToAllocate = tribeBalanceToMigrate.sub(new BN(twoMillionTribe));
  // distribute 75 tribe per block instead of 100
  await tribalChief.updateBlockReward(seventyFiveTribe);
  // then migrate the balance minus 2 million to the tribalchief
  await core.allocateTribe(tribalChief.address, tribeBalanceToAllocate);

  await tribalChief.add(
    allocPoints,
    stakingTokenWrapper.address,
    ZERO_ADDRESS,
    defaultPoolRewardObject,
  );
  // Initialize the staking token wrapper before creating the next pool
  await stakingTokenWrapper.init(0);

  // create the pool for fei/tribe LP tokens
  await tribalChief.add(
    allocPoints,
    feiTribePairAddress,
    ZERO_ADDRESS,
    defaultPoolRewardObject,
  );

  // create the pool for fei/curve3Metapool LP tokens
  await tribalChief.add(
    allocPoints,
    curve3MetapoolAddress,
    ZERO_ADDRESS,
    defaultPoolRewardObject,
  );
}

async function teardown(addresses, oldContracts, contracts, logging) {}

// the purpose of this function is not to unit test things,
// but to just log out what just happened
// this function will log out false if anything incorrect happened during the run or deploy
async function validate(addresses, oldContracts, contracts, logging) {
  const { feiRewardsDistributorAddress, feiTribePairAddress, curve3MetapoolAddress } = addresses;
  const { stakingTokenWrapper, tribalChief, tribe} = contracts;

  const expectedValues = {
    feiRewardsDistributorBalance: (await tribe.balanceOf(feiRewardsDistributorAddress)).toString() === '0',
    tribalChiefAllocPoints: (await tribalChief.totalAllocPoint()).toString() === (allocPoints * 3).toString(),
    tribalChiefNumPools: (await tribalChief.numPools()).toString() === (3).toString(),
    tribalChiefStakingTokenWrapperPool: await tribalChief.stakedToken(0) === stakingTokenWrapper.address,
    tribalChiefFEITRIBEUniswapPool: await tribalChief.stakedToken(1) === feiTribePairAddress,
    tribalChiefCurve3FEIMetaPool: await tribalChief.stakedToken(2) === curve3MetapoolAddress,
  };

  expect(expectedValues.feiRewardsDistributorBalance).to.be.true;
  expect(expectedValues.tribalChiefAllocPoints).to.be.true;
  expect(expectedValues.tribalChiefNumPools).to.be.true;
  expect(expectedValues.tribalChiefStakingTokenWrapperPool).to.be.true;
  expect(expectedValues.tribalChiefFEITRIBEUniswapPool).to.be.true;
  expect(expectedValues.tribalChiefCurve3FEIMetaPool).to.be.true;

  console.log(expectedValues);
}

module.exports = {
  setup, run, teardown, validate,
};
