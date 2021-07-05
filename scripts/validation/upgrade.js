const { BN, ether, time } = require('@openzeppelin/test-helpers');
const hre = require('hardhat');
const { syncPool } = require('../utils/syncPool');
const { check, getAddresses } = require('../utils/helpers');

const { web3 } = hre;

const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');
const UniswapPCVController = artifacts.require('UniswapPCVController');
const BondingCurve = artifacts.require('BondingCurve');
const Core = artifacts.require('Core');

async function successfulReweight(controller) {
  const reserves = await controller.getReserves();
  const peg = await controller.readOracle();
  const pegBN = new BN(peg.value).div(new BN('1000000000000000000'));
  const currentPrice = reserves[0].div(reserves[1]);
  console.log(`peg:${peg}, price:${currentPrice}, r0: ${reserves[0]}, r1: ${reserves[1]}`);
  return pegBN.eq(currentPrice);
}

async function main() {
  const { 
    coreAddress, 
    feiAddress,
    ethUniswapPCVDepositAddress, 
    ethUniswapPCVControllerAddress, 
    ethBondingCurveAddress,
    ethPairAddress
  } = getAddresses();

  const accounts = await web3.eth.getAccounts();

  const deposit = await UniswapPCVDeposit.at(ethUniswapPCVDepositAddress);
  const controller = await UniswapPCVController.at(ethUniswapPCVControllerAddress);
  const bc = await BondingCurve.at(ethBondingCurveAddress);
  const core = await Core.at(coreAddress);

  console.log('Access Control');
  
  const depositMinter = await core.isMinter(deposit.address);
  check(depositMinter, 'Grant new deposit Minter');

  const controllerMinter = await core.isMinter(controller.address);
  check(controllerMinter, 'Grant new controller Minter');

  const controllerBurner = await core.isBurner(controller.address);
  check(controllerBurner, 'Grant new controller Burner');

  const bcMinter = await core.isMinter(bc.address);
  check(bcMinter, 'Grant new bonding curve Minter');

  console.log('\nBondingCurve');
  console.log('Approving');
  const tenEth = ether('10');

  console.log('Purchasing');
  await bc.purchase(accounts[1], tenEth, {value: tenEth});

  const pcv = await bc.balance();
  check(pcv.eq(new BN(tenEth)), 'PCV escrowed in curve');

  console.log('Allocate');
  await bc.allocate();
  console.log(`PCV Deposit value: ${(await deposit.balance()).toString()}`);

  console.log('\nController');
  console.log('Moving Pair below 3%');
  
  await syncPool(new BN('10300'), { feiAddress, ethUniswapPCVDepositAddress, ethPairAddress }, accounts[0]);

  console.log('Advancing Time');
  await time.increase(await controller.remainingTime());

  const eligible = await controller.reweightEligible();
  check(eligible, 'Reweight eligible');

  let timeReset; 
  let successReweight;
  if (eligible) {
    await controller.reweight();
    successReweight = await successfulReweight(controller);
    check(successReweight, 'Rebase Success');

    timeReset = !(await controller.isTimeEnded());
    check(timeReset, 'Time reset');
  }

  console.log('Moving Pair above 3%');
  await syncPool(new BN('9700'), { feiAddress, ethUniswapPCVDepositAddress, ethPairAddress }, accounts[0]);

  if (eligible) {
    await controller.forceReweight();
    successReweight = await successfulReweight(controller);
    check(successReweight, 'Force Reverse Reweight Success');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
