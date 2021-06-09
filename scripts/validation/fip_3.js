const { BN, time } = require('@openzeppelin/test-helpers');

const EthUniswapPCVController = artifacts.require('UniswapPCVController');
const Fei = artifacts.require('Fei');
const IUniswapV2Pair = artifacts.require('IUniswapV2Pair');
const Core = artifacts.require('Core');

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

function check(flag, message) {
  if (flag) {
    console.log(`PASS: ${message}`); 
  } else {
    throw Error(`FAIL: ${message}`);
  }
}

async function checkAccessControl(oldController, newController, core) {
  console.log('Access Control');
  
  const revokedOld = !(await core.isMinter(oldController.address));
  check(revokedOld, 'Revoke old controller Minter');

  const revokedOldController = !(await core.isPCVController(oldController.address));
  check(revokedOldController, 'Revoke old controller PCVController');

  const minterNew = await core.isMinter(newController.address);
  check(minterNew, 'Grant new deposit Minter');

  const controllerNew = await core.isPCVController(newController.address);
  check(controllerNew, 'Grant new controller PCVController');
}

async function checkParameters(newController, depositAddress) {
  console.log('\nParameters');

  const linkedDeposit = await newController.pcvDeposit();

  const updatedDeposit = linkedDeposit == depositAddress;
  check(updatedDeposit, 'New PCV Deposit updates');
}

async function integrationTestReweight(newController) {
  console.log('\nIntegration Testing Reweight');

  console.log('Fast forward');
  await time.increase(await newController.remainingTime());
  const timeComplete = await newController.isTimeEnded();
  check(timeComplete, 'Time complete');

  console.log('Moving Pair below 3%');
  await syncPool(new BN('10300'), newController);

  const eligible = await newController.reweightEligible();
  check(eligible, 'Reweight eligible');

  await newController.reweight();
  const successReweight = await successfulReweight(newController);
  check(successReweight, 'second reweight success');
}

async function main() {
  // eslint-disable-next-line global-require
  require('dotenv').config();

  let oldControllerAddress; let newControllerAddress; let coreAddress; let 
    depositAddress;
  if (process.env.TESTNET_MODE) {
    console.log('Testnet Mode');
    oldControllerAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_CONTROLLER_01;
    newControllerAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_CONTROLLER;
    coreAddress = process.env.RINKEBY_CORE;
    depositAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_DEPOSIT;
  } else {
    console.log('Mainnet Mode');
    oldControllerAddress = process.env.MAINNET_ETH_UNISWAP_PCV_CONTROLLER_01;
    newControllerAddress = process.env.MAINNET_ETH_UNISWAP_PCV_CONTROLLER;
    coreAddress = process.env.MAINNET_CORE;
    depositAddress = process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT;
  }

  const newController = await EthUniswapPCVController.at(newControllerAddress);
  const oldController = await EthUniswapPCVController.at(oldControllerAddress);
  const core = await Core.at(coreAddress);

  await checkAccessControl(oldController, newController, core);

  await checkParameters(newController, depositAddress);

  await integrationTestReweight(newController);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
