const hre = require('hardhat');
const { BN, time } = require('@openzeppelin/test-helpers');
const { syncPool } = require('../utils/syncPool');
const { check, getAddresses } = require('../utils/helpers');

const { web3 } = hre;

const UniswapPCVController = artifacts.require('UniswapPCVController');
const Core = artifacts.require('Core');

async function successfulReweight(controller) {
  const reserves = await controller.getReserves();
  const peg = await controller.readOracle();
  const pegBN = new BN(peg.value).div(new BN('1000000000000000000'));
  const currentPrice = reserves[0].div(reserves[1]);
  console.log(`peg:${peg}, price:${currentPrice}, r0: ${reserves[0]}, r1: ${reserves[1]}`);

  return pegBN.eq(currentPrice);
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

async function checkParameters(newController, ethUniswapPCVDepositAddress) {
  console.log('\nParameters');

  const linkedDeposit = await newController.pcvDeposit();

  const updatedDeposit = linkedDeposit === ethUniswapPCVDepositAddress;
  check(updatedDeposit, 'New PCV Deposit updates');
}

async function integrationTestReweight(newController) {
  console.log('\nIntegration Testing Reweight');

  console.log('Fast forward');
  await time.increase(await newController.remainingTime());
  const timeComplete = await newController.isTimeEnded();
  check(timeComplete, 'Time complete');

  console.log('Moving Pair below 3%');
  const { feiAddress, ethUniswapPCVDepositAddress, ethPairAddress } = getAddresses();
  const accounts = await web3.eth.getAccounts();
  await syncPool(new BN('10300'), { feiAddress, ethUniswapPCVDepositAddress, ethPairAddress}, accounts[0]);

  const eligible = await newController.reweightEligible();
  check(eligible, 'Reweight eligible');

  await newController.reweight();
  const successReweight = await successfulReweight(newController);
  check(successReweight, 'second reweight success');
}

async function main() {
  const {
    oldEthUniswapPCVControllerAddress, 
    ethUniswapPCVControllerAddress, 
    coreAddress, 
    ethUniswapPCVDepositAddress
  } = getAddresses();

  const newController = await UniswapPCVController.at(ethUniswapPCVControllerAddress);
  const oldController = await UniswapPCVController.at(oldEthUniswapPCVControllerAddress);
  const core = await Core.at(coreAddress);

  await checkAccessControl(oldController, newController, core);

  await checkParameters(newController, ethUniswapPCVDepositAddress);

  await integrationTestReweight(newController);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
