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

// this number takes the total seconds per year, divides by 13 to get the total 
// number of ethereum blocks per year, then multiplies the amount of blocks by 75 as each block we distribute 75 tribe,
// then divides the total amount of tribe distributed annually by 35, so that by calling it once every week,
// we are always overfunded.
// Then we that quotient and multiply it by 10^18 so that it has the appropriate amount of decimals on it to be the amount of tribe to drip
const dripAmount = new BN(Math.floor(((3.154e+7 / 13) * 75) / 35)).mul(new BN(10).pow(new BN(18)));

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
    stakingTokenWrapper, tribalChief, tribe, core, erc20Dripper
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
    
  const tribeBalanceToAllocate = tribeBalanceToMigrate.sub(new BN(twoMillionTribe)).sub(dripAmount);

  // distribute 75 tribe per block instead of 100
  await tribalChief.updateBlockReward(seventyFiveTribe);
  // then migrate the balance minus 2 million and the first drip amount to the tribalchief
  await core.allocateTribe(erc20Dripper.address, tribeBalanceToAllocate);
  // then send the first drip amount straight to the TribalChief
  await core.allocateTribe(tribalChief.address, dripAmount);

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

  // assert that the expected values all came back true
  for (const key in expectedValues) {
    expect(expectedValues[key]).to.be.true;
  }

  console.log(expectedValues);
}

module.exports = {
  setup, run, teardown, validate,
};
