/* eslint-disable quotes */
import { expectApprox, time } from '../../test/helpers';

const { ethers } = require('hardhat');
const { expect } = require('chai');

const e18 = '000000000000000000';
const START_TIMESTAMP = '1632355200'; // 9-23-21
const END_TIMESTAMP = '1647993600'; // 3-23-22
const TRIBE_PER_SECOND = '250000000000000000'; // .25 TRIBE/s
const FEI_PROPOSAL_ID = 37;

const IERC20 = artifacts.require('IERC20');

async function setup(addresses, oldContracts, contracts, logging) {
  const { aaveGovernanceV2, aaveLendingPool, fei } = contracts;
  const proposal = await aaveGovernanceV2.getProposalById(FEI_PROPOSAL_ID);
  await time.advanceBlockTo(proposal.endBlock);
  await aaveGovernanceV2.queue(FEI_PROPOSAL_ID);
  await time.increaseTo(START_TIMESTAMP);
  await aaveGovernanceV2.execute(FEI_PROPOSAL_ID);
}

/*
 1. Mint 25M FEI to Aave FEI PCV Deposit
 2. Deposit Aave FEI PCV Deposit
 3. Transfer 4M TRIBE from dripper to incentives controller
 4. Upgrade proxy admin to default proxy admin
 5. Trigger reward rate for aFeiVariableBorrow
 6. Set distribution end
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    fei,
    aaveFeiPCVDeposit,
    erc20Dripper,
    aaveLendingPool
  } = contracts;

  const {
    aaveTribeIncentivesControllerAddress,
    timelockAddress,
    proxyAdminAddress
  } = addresses;

  const {
    variableDebtTokenAddress,
  } = await aaveLendingPool.getReserveData(fei.address);

  const aFeiVariableBorrowAddress = variableDebtTokenAddress;

  // 1. 
  await fei.mint(aaveFeiPCVDeposit.address, `25000000${e18}`);

  // 2.
  await aaveFeiPCVDeposit.deposit();

  // 3. 
  await erc20Dripper.withdraw(aaveTribeIncentivesControllerAddress, `4000000${e18}`);

  // 4.
  const incentivesControllerAbi = [
    'function setDistributionEnd(uint256 distributionEnd)', 
    'function configureAssets(address[] assets, uint256[] emissionsPerSecond)',
    'function changeAdmin(address newAdmin)'
  ];
  const adminSigner = ethers.provider.getSigner(timelockAddress);
  const incentivesController = new ethers.Contract(aaveTribeIncentivesControllerAddress, incentivesControllerAbi, adminSigner);

  await incentivesController.changeAdmin(proxyAdminAddress);

  // 5.
  await incentivesController.configureAssets([aFeiVariableBorrowAddress], [TRIBE_PER_SECOND]);

  // 6.
  await incentivesController.setDistributionEnd(END_TIMESTAMP);
}

async function teardown(addresses, oldContracts, contracts, logging) {}

async function validate(addresses, oldContracts, contracts) {
  const {
    tribe,
    aaveFeiPCVDeposit,
    proxyAdmin,
    fei,
    aaveLendingPool
  } = contracts;

  const {
    aTokenAddress,
    variableDebtTokenAddress,
  } = await aaveLendingPool.getReserveData(fei.address);

  const {
    aaveTribeIncentivesControllerAddress,
    timelockAddress
  } = addresses;

  const aFeiVariableBorrowAddress = variableDebtTokenAddress;
  const aFei = await IERC20.at(aTokenAddress);

  expectApprox(await fei.balanceOf(aaveFeiPCVDeposit.address), `0`);
  expectApprox(await aFei.balanceOf(aaveFeiPCVDeposit.address), `25000000${e18}`);
  
  // TODO waiting for exact aFEI address to be known
  // expectApprox(await aaveFeiPCVDeposit.balance(), `25000000${e18}`);

  expect(await tribe.balanceOf(aaveTribeIncentivesControllerAddress)).to.be.bignumber.equal(`4000000${e18}`);
  expect(await proxyAdmin.getProxyAdmin(aaveTribeIncentivesControllerAddress)).to.be.equal(proxyAdmin.address);

  const incentivesControllerAbi = [{"inputs":[{"internalType":"address","name":"rewardToken","type":"address"},{"internalType":"address","name":"emissionManager","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":false,"internalType":"uint256","name":"emission","type":"uint256"}],"name":"AssetConfigUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":false,"internalType":"uint256","name":"index","type":"uint256"}],"name":"AssetIndexUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"claimer","type":"address"}],"name":"ClaimerSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newDistributionEnd","type":"uint256"}],"name":"DistributionEndUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RewardsAccrued","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"address","name":"claimer","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RewardsClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":false,"internalType":"uint256","name":"index","type":"uint256"}],"name":"UserIndexUpdated","type":"event"},{"inputs":[],"name":"DISTRIBUTION_END","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"EMISSION_MANAGER","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PRECISION","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REVISION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REWARD_TOKEN","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TOKEN","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"assets","outputs":[{"internalType":"uint104","name":"emissionPerSecond","type":"uint104"},{"internalType":"uint104","name":"index","type":"uint104"},{"internalType":"uint40","name":"lastUpdateTimestamp","type":"uint40"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"assets","type":"address[]"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"claimRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"assets","type":"address[]"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"user","type":"address"},{"internalType":"address","name":"to","type":"address"}],"name":"claimRewardsOnBehalf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"assets","type":"address[]"},{"internalType":"uint256[]","name":"emissionsPerSecond","type":"uint256[]"}],"name":"configureAssets","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getAssetData","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getClaimer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getDistributionEnd","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"assets","type":"address[]"},{"internalType":"address","name":"user","type":"address"}],"name":"getRewardsBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"address","name":"asset","type":"address"}],"name":"getUserAssetData","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"getUserUnclaimedRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"totalSupply","type":"uint256"},{"internalType":"uint256","name":"userBalance","type":"uint256"}],"name":"handleAction","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"addressesProvider","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"address","name":"caller","type":"address"}],"name":"setClaimer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"distributionEnd","type":"uint256"}],"name":"setDistributionEnd","outputs":[],"stateMutability":"nonpayable","type":"function"}];
  const adminSigner = ethers.provider.getSigner(timelockAddress);
  const incentivesController = new ethers.Contract(aaveTribeIncentivesControllerAddress, incentivesControllerAbi, adminSigner);

  const end = await incentivesController.getDistributionEnd();
  expect(end.toString()).to.be.equal(END_TIMESTAMP);

  const config = await incentivesController.getAssetData(aFeiVariableBorrowAddress);
  expect(config[1].toString()).to.be.equal(TRIBE_PER_SECOND);
}

module.exports = {
  setup, run, teardown, validate
};
