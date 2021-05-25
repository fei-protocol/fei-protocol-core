const { BN, time } = require('@openzeppelin/test-helpers');
require('@openzeppelin/test-helpers/configure')({
    provider: 'http://localhost:7545',
});

const EthUniswapPCVController = artifacts.require("UniswapPCVController");
const Fei = artifacts.require("Fei");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const Core = artifacts.require("Core");

// A validation script to make sure after the DAO steps are run that the necessary state updates are made
module.exports = async function(callback) {
  require('dotenv').config();

  var oldControllerAddress, newControllerAddress, coreAddress, depositAddress;
  if(process.env.TESTNET_MODE) {
    oldControllerAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_CONTROLLER_01;
    newControllerAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_CONTROLLER;
    coreAddress = process.env.RINKEBY_CORE;
    depositAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_DEPOSIT;
  } else {
    oldControllerAddress = process.env.MAINNET_ETH_UNISWAP_PCV_CONTROLLER_01;
    newControllerAddress = process.env.MAINNET_ETH_UNISWAP_PCV_CONTROLLER;
    coreAddress = process.env.MAINNET_CORE;
    depositAddress = process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT;
  }

  let newController = await EthUniswapPCVController.at(newControllerAddress);
  let oldController = await EthUniswapPCVController.at(oldControllerAddress);
  let core = await Core.at(coreAddress);

  console.log("Access Control");
  
  let revokedOld = !(await core.isMinter(oldController.address));
  console.log((revokedOld ? "PASS" : "FAIL") + ": Revoke old controller Minter");

  let revokedOldController = !(await core.isPCVController(oldController.address));
  console.log((revokedOldController ? "PASS" : "FAIL") + ": Revoke old controller PCVController");

  let minterNew = await core.isMinter(newController.address);
  console.log((minterNew ? "PASS" : "FAIL") + ": Grant new deposit Minter");

  let controllerNew = await core.isPCVController(newController.address);
  console.log((controllerNew ? "PASS" : "FAIL") + ": Grant new controller PCVController");

  console.log("\nParameters");

  let linkedDeposit = await newController.pcvDeposit();

  let updatedDeposit = linkedDeposit == depositAddress;
  console.log((updatedDeposit ? "PASS" : "FAIL") + ": New PCV Deposit updates");

  console.log("\nIntegration Testing");
  console.log("Moving Pair below 3%");
  await syncPool(new BN('10300'), newController);

  console.log("Advancing Time");
  await time.increase(await newController.remainingTime());

  let eligible = await newController.reweightEligible();
  console.log((eligible ? "PASS" : "FAIL") + ": Reweight eligible");

  var timeReset, successReweight;
  if (eligible) {
    await newController.reweight();
    successReweight = await successfulReweight(newController);
    console.log((successReweight ? "PASS" : "FAIL") + ": First reweight success");

    timeReset = !(await newController.isTimeEnded());
    console.log((timeReset ? "PASS" : "FAIL") + ": Time reset");
  }

  console.log("Second Attempt");
  console.log("Fast forward");
  await time.increase(await newController.remainingTime());
  let timeComplete = await newController.isTimeEnded();
  console.log((timeComplete ? "PASS" : "FAIL") + ": Time complete");

  eligible = await newController.reweightEligible();
  console.log((!eligible ? "PASS" : "FAIL") + ": Reweight not eligible before sync");

  console.log("Moving Pair below 3%");
  await syncPool(new BN('10300'), newController);

  eligible = await newController.reweightEligible();
  console.log((eligible ? "PASS" : "FAIL") + ": Reweight eligible");

  await newController.reweight();
  successReweight = await successfulReweight(newController);
  console.log((successReweight ? "PASS" : "FAIL") + ": second reweight success");

  callback();
}

async function successfulReweight(controller) {
    let reserves = await controller.getReserves();
    let peg = await controller.peg();
    let pegBN = new BN(peg.value).div(new BN('1000000000000000000'));
    let currentPrice = reserves[0].div(reserves[1]);
    console.log(`peg:${peg}, price:${currentPrice}, r0: ${reserves[0]}, r1: ${reserves[1]}`);

    return pegBN.eq(currentPrice);
}

async function syncPool(bpsMul, controller) {
    let fei = await Fei.at(await controller.fei());
    let ethPair = await IUniswapV2Pair.at(await controller.pair());
  
    console.log('Current');
  
    let reserves = await controller.getReserves();
    let peg = await controller.peg();
    let pegBN = new BN(peg.value).div(new BN('1000000000000000000'));
    let currentPrice = reserves[0].div(reserves[1]);
  
    let target = pegBN.mul(bpsMul).div(new BN('10000'));
    console.log(`Pegging ${currentPrice} to ${target}. Peg: ${pegBN}`);
  
  
    console.log('Sync');
    let targetFei = reserves[1].mul(target);
    let currentFei = await fei.balanceOf(ethPair.address);
  
    await fei.burnFrom(ethPair.address, currentFei);
    await fei.mint(ethPair.address, targetFei);
    await ethPair.sync();
}