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
    console.log("Testnet Mode");
    oldControllerAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_CONTROLLER_01;
    newControllerAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_CONTROLLER;
    coreAddress = process.env.RINKEBY_CORE;
    depositAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_DEPOSIT;
  } else {
    console.log("Mainnet Mode");
    oldControllerAddress = process.env.MAINNET_ETH_UNISWAP_PCV_CONTROLLER_01;
    newControllerAddress = process.env.MAINNET_ETH_UNISWAP_PCV_CONTROLLER;
    coreAddress = process.env.MAINNET_CORE;
    depositAddress = process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT;
  }

  let newController = await EthUniswapPCVController.at(newControllerAddress);
  let oldController = await EthUniswapPCVController.at(oldControllerAddress);
  let core = await Core.at(coreAddress);

  await checkAccessControl(oldController, newController, core);

  await checkParameters(newController, depositAddress);

  await integrationTestReweight(newController);

  callback();
}

async function checkAccessControl(oldController, newController, core) {
  console.log("Access Control");
  
  let revokedOld = !(await core.isMinter(oldController.address));
  check(revokedOld, "Revoke old controller Minter");

  let revokedOldController = !(await core.isPCVController(oldController.address));
  check(revokedOldController, "Revoke old controller PCVController");

  let minterNew = await core.isMinter(newController.address);
  check(minterNew, "Grant new deposit Minter");

  let controllerNew = await core.isPCVController(newController.address);
  check(controllerNew, "Grant new controller PCVController");
}

async function checkParameters(newController, depositAddress) {
  console.log("\nParameters");

  let linkedDeposit = await newController.pcvDeposit();

  let updatedDeposit = linkedDeposit == depositAddress;
  check(updatedDeposit, "New PCV Deposit updates");
}

async function integrationTestReweight(newController) {
  console.log("\nIntegration Testing Reweight");

  console.log("Fast forward");
  await time.increase(await newController.remainingTime());
  let timeComplete = await newController.isTimeEnded();
  check(timeComplete, "Time complete");

  console.log("Moving Pair below 3%");
  await syncPool(new BN('10300'), newController);

  let eligible = await newController.reweightEligible();
  check(eligible, "Reweight eligible");

  await newController.reweight();
  let successReweight = await successfulReweight(newController);
  check(successReweight, "second reweight success");
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

function check(flag, message) {
  if (flag) {
    console.log("PASS: " + message) 
  } else {
    throw "FAIL: " + message;
  }
}