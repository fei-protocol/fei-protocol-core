const { BN, ether, time } = require('@openzeppelin/test-helpers');

require('@openzeppelin/test-helpers/configure')({
  provider: 'http://localhost:7545',
});

const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');
const UniswapPCVController = artifacts.require('UniswapPCVController');
const BondingCurve = artifacts.require('BondingCurve');
const Core = artifacts.require('Core');
const IWETH = artifacts.require('IWETH');
const IERC20 = artifacts.require('IERC20');
const IUniswapV2Pair = artifacts.require('IUniswapV2Pair');
const Fei = artifacts.require('Fei');

async function successfulReweight(controller) {
  const reserves = await controller.getReserves();
  const peg = await controller.peg();
  const pegBN = new BN(peg.value).div(new BN('1000000000000000000'));
  const currentPrice = reserves[0].div(reserves[1]);
  console.log(`peg:${peg}, price:${currentPrice}, r0: ${reserves[0]}, r1: ${reserves[1]}`);
  return pegBN.eq(currentPrice);
}

async function syncPool(bpsMul, controller) {
  const fei = await Fei.at(await controller.fei());
  const ethPair = await IUniswapV2Pair.at(await controller.pair());
  
  console.log('Current');
  
  const reserves = await controller.getReserves();
  const peg = await controller.peg();
  const pegBN = new BN(peg.value).div(new BN('1000000000000000000'));
  const currentPrice = reserves[0].div(reserves[1]);
  
  const target = pegBN.mul(bpsMul).div(new BN('10000'));
  console.log(`Pegging ${currentPrice} to ${target}. Peg: ${pegBN}`);
  
  console.log('Sync');
  const targetFei = reserves[1].mul(target);
  const currentFei = await fei.balanceOf(ethPair.address);
  
  await fei.burnFrom(ethPair.address, currentFei);
  await fei.mint(ethPair.address, targetFei);
  await ethPair.sync();
}

// The DAO steps for upgrading to ERC20 compatible versions, these must be done with Governor access control privileges
module.exports = async function(callback) {
  // eslint-disable-next-line global-require
  require('dotenv').config();
  const accounts = await web3.eth.getAccounts();

  const deposit = await UniswapPCVDeposit.deployed();
  const controller = await UniswapPCVController.deployed();
  const bc = await BondingCurve.deployed();
  const core = await Core.at(process.env.MAINNET_CORE);
  const weth = await IWETH.at(process.env.MAINNET_WETH);
  const wetherc20 = await IERC20.at(process.env.MAINNET_WETH);

  console.log('Access Control');
  
  const depositMinter = await core.isMinter(deposit.address);
  console.log(`${depositMinter ? 'PASS' : 'FAIL'}: Grant new deposit Minter`);

  const controllerMinter = await core.isMinter(controller.address);
  console.log(`${controllerMinter ? 'PASS' : 'FAIL'}: Grant new controller Minter`);

  const controllerBurner = await core.isBurner(controller.address);
  console.log(`${controllerBurner ? 'PASS' : 'FAIL'}: Grant new controller Burner`);

  const bcMinter = await core.isMinter(bc.address);
  console.log(`${bcMinter ? 'PASS' : 'FAIL'}: Grant new bonding curve Minter`);

  console.log('\nTODO: Parameters');

  console.log('\nBondingCurve');
  console.log('Approving');
  const mil = ether('1000');
  await wetherc20.approve(bc.address, mil);
  await weth.deposit({value: mil});

  console.log('Purchasing');
  await bc.purchase(accounts[1], mil);

  const pcv = await bc.getTotalPCVHeld();
  console.log(`${pcv.eq(new BN(mil)) ? 'PASS' : 'FAIL'}: PCV escrowed in curve`);

  console.log('Allocate');
  await bc.allocate();
  console.log(`PCV Deposit value: ${(await deposit.totalValue()).toString()}`);

  console.log('\nController');
  console.log('Moving Pair below 3%');
  await syncPool(new BN('10300'), controller);

  console.log('Advancing Time');
  await time.increase(await controller.remainingTime());

  const eligible = await controller.reweightEligible();
  console.log(`${eligible ? 'PASS' : 'FAIL'}: Reweight eligible`);

  let timeReset; 
  let successReweight;
  if (eligible) {
    await controller.reweight();
    successReweight = await successfulReweight(controller);
    console.log(`${successReweight ? 'PASS' : 'FAIL'}: Rebase Success`);

    timeReset = !(await controller.isTimeEnded());
    console.log(`${timeReset ? 'PASS' : 'FAIL'}: Time reset`);
  }

  console.log('Moving Pair above 3%');
  await syncPool(new BN('9700'), controller);

  if (eligible) {
    await controller.forceReweight();
    successReweight = await successfulReweight(controller);
    console.log(`${successReweight ? 'PASS' : 'FAIL'}: Force Reverse Reweight Success`);
  }

  callback();
};
