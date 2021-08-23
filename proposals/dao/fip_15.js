/* eslint-disable max-len */
/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
const { ethers } = require('hardhat');
const hre = require('hardhat');
const { BN } = require('../../test/helpers');

const {
  coreAddress,
  tribeAddress,
  feiRewardsDistributorAddress,
  curve3Metapool,
  feiTribePairAddress
} = require('../../contract-addresses/mainnetAddresses.json');

const Tribe = artifacts.require('Tribe');
const Core = artifacts.require('Core');

const e18 = '000000000000000000';
const seventyFiveTribe = `75${e18}`;
const twoMillionTribe = `2000000${e18}`;
const allocPoints = 1000;
const zeroMultiplier = '10000';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const defaultPoolRewardObject = [
  {
    lockLength: 0,
    rewardMultiplier: zeroMultiplier,
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
  const { stakingTokenWrapper, tribalChief } = contracts;
  const { timelockAddress } = addresses;

  const tribe = await Tribe.at(tribeAddress.address);
  const core = await Core.at(coreAddress.address);

  // we should subtract 2 million off this number to leave 2 million tribe in the DAO
  const tribeBalanceToMigrate = await tribe.balanceOf(feiRewardsDistributorAddress.address);

  const governorWithdrawTribeAbi = ['function governorWithdrawTribe(uint256 amount)'];
  const governorWithdrawTribeInterface = new ethers.utils.Interface(governorWithdrawTribeAbi);
  const encodedGovernorWithdrawTribe = governorWithdrawTribeInterface.encodeFunctionData('governorWithdrawTribe', [tribeBalanceToMigrate.toString()]);
  const adminSigner = ethers.provider.getSigner(timelockAddress);
  await (
    await adminSigner.sendTransaction({ data: encodedGovernorWithdrawTribe, to: feiRewardsDistributorAddress.address })
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
    feiTribePairAddress.address,
    ZERO_ADDRESS,
    defaultPoolRewardObject,
  );

  // create the pool for fei/curve3Metapool LP tokens
  await tribalChief.add(
    allocPoints,
    curve3Metapool.address,
    ZERO_ADDRESS,
    defaultPoolRewardObject,
  );
}

async function teardown(addresses, oldContracts, contracts, logging) {}

// the purpose of this function is not to unit test things,
// but to just log out what just happened
// this function will log out false if anything incorrect happened during the run or deploy
async function validate(addresses, oldContracts, contracts, logging) {
  const { stakingTokenWrapper, tribalChief } = contracts;
  const tribe = await Tribe.at(tribeAddress.address);

  const invariants = {
    feiRewardsDistributorBalance: (await tribe.balanceOf(feiRewardsDistributorAddress.address)).toString() === '0',
    tribalChiefAllocPoints: (await tribalChief.totalAllocPoint()).toString() === (allocPoints * 3).toString(),
    tribalChiefNumPools: (await tribalChief.numPools()).toString() === (3).toString(),
    tribalChiefStakingTokenWrapperPool: await tribalChief.stakedToken(0) === stakingTokenWrapper.address,
    tribalChiefFEITRIBEUniswapPool: await tribalChief.stakedToken(1) === feiTribePairAddress.address,
    tribalChiefCurve3FEIMetaPool: await tribalChief.stakedToken(2) === curve3Metapool.address,
  };
  
  console.log(invariants);
}

module.exports = {
  setup, run, teardown, validate,
};
