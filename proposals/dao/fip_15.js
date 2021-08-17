/* eslint-disable max-len */
/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
const { countReset } = require('console');
const { web3 } = require('hardhat');
const hre = require('hardhat');

const {
  coreAddress,
  rariPool8TribeAddress,
  tribeAddress,
  feiRewardsDistributorAddress,
} = require('../../contract-addresses/mainnetAddresses.json');

const StakingTokenWrapper = artifacts.require('StakingTokenWrapper');
const TribalChief = artifacts.require('TribalChief');
const Tribe = artifacts.require('Tribe');
const Core = artifacts.require('Core');

const e18 = '000000000000000000';
const seventyFiveTribe = `75${e18}`;
const allocPoints = 1000;
const zeroMultiplier = '10000';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const defaultPoolRewardObject = [
  {
    lockLength: 0,
    rewardMultiplier: zeroMultiplier,
  },
];

async function validate(addresses, oldContracts, contracts, logging) {}

// nothing needed here
async function setup(addresses, oldContracts, contracts, logging) {}

// should be used for chainforked mainnet
// default sender has dao admin priviledges

// assert that state changes correctly
// add the first couple of pools to the tribal chief
// add pool for curve staking, fei/tribe on univ2, rari tribe pool
// add tests to the validate function. Just test things like balances, allocation points, etc

async function run(addresses, oldContracts, contracts, logging = false) {
  const { governorAddress, timelockAddress } = addresses;

  const tribe = await Tribe.at(tribeAddress.address);
  const core = await Core.at(coreAddress.address);
  // assign feiRewardDistributor to the tribalchief, then call governorWithdrawTribe
  // to remove all rewards
  const feiRewardsDistributor = await TribalChief.at(feiRewardsDistributorAddress.address);

  const tribeBalanceToMigrate = await tribe.balanceOf(feiRewardsDistributorAddress.address);

  // impersonate the governor so that we can move tribe out of the core contract
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [governorAddress],
  });

  const tribalChief = await TribalChief.deploy(coreAddress.address, tribeAddress.address);
  const stakingTokenWrapper = await StakingTokenWrapper.deploy(
    tribalChief.address,
    rariPool8TribeAddress.address,
  );
  await feiRewardsDistributor.governorWithdrawTribe(tribeBalanceToMigrate, { from: governorAddress });

  // distribute 75 tribe per block instead of 100
  await tribalChief.updateBlockReward(seventyFiveTribe, { from: governorAddress });
  await core.allocateTribe(tribalChief.address, tribeBalanceToMigrate, { from: governorAddress });

  // create this pool, and then initialize the staking token wrapper before we create the next pool
  await tribalChief.add(
    allocPoints,
    stakingTokenWrapper.address,
    ZERO_ADDRESS,
    defaultPoolRewardObject,
    { from: governorAddress },
  );
  await stakingTokenWrapper.init(0);

  await tribalChief.add(
    allocPoints,
    rariPool8TribeAddress.address,
    ZERO_ADDRESS,
    defaultPoolRewardObject,
    { from: governorAddress },
  );

  // TODO add assertions here that all pool info is correct
}

async function teardown(addresses, oldContracts, contracts, logging) {}

module.exports = {
  setup, run, teardown, validate,
};
