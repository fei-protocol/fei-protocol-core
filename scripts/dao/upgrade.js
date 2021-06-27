const {
  ZERO_ADDRESS
} = require('@openzeppelin/test-helpers/src/constants');

const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');
const UniswapPCVController = artifacts.require('UniswapPCVController');
const BondingCurve = artifacts.require('BondingCurve');
const TribeReserveStabilizer = artifacts.require('TribeReserveStabilizer');
const EthReserveStabilizer = artifacts.require('EthReserveStabilizer');
const PCVDripController = artifacts.require('PCVDripController');
const RatioPCVController = artifacts.require('RatioPCVController');
const Core = artifacts.require('Core');
const Tribe = artifacts.require('Tribe');
const Fei = artifacts.require('Fei');

async function upgrade(addresses, logging = false) {
  const {
    coreAddress,
    oldUniswapPCVDepositAddress,
    ethUniswapPCVDepositAddress,
    ethUniswapPCVControllerAddress,
    ethBondingCurveAddress,
    ethReserveStabilizerAddress,
    tribeReserveStabilizerAddress,
    ratioPCVControllerAddress,
    pcvDripControllerAddress,
    ethPairAddress,
    timelockAddress
  } = addresses;

  const deposit = await UniswapPCVDeposit.at(ethUniswapPCVDepositAddress);
  const controller = await UniswapPCVController.at(ethUniswapPCVControllerAddress);
  const bondingCurve = await BondingCurve.at(ethBondingCurveAddress);
  const tribeReserveStabilizer = await TribeReserveStabilizer.at(tribeReserveStabilizerAddress);
  const ratioController = await RatioPCVController.at(ratioPCVControllerAddress);
  const pcvDripController = await PCVDripController.at(pcvDripControllerAddress);
  const ethReserveStabilizer = await EthReserveStabilizer.at(ethReserveStabilizerAddress);

  const core = await Core.at(coreAddress);
  const tribe = await Tribe.at(await core.tribe());
  const fei = await Fei.at(await core.fei());

  // 1 instead of burner
  logging ? console.log('Granting Burner to new UniswapPCVController') : undefined;
  await core.grantBurner(controller.address);

  logging ? console.log('Granting Minter to new UniswapPCVController') : undefined;
  await core.grantMinter(controller.address);

  logging ? console.log('Granting Minter to new BondingCurve') : undefined;
  await core.grantMinter(bondingCurve.address);

  logging ? console.log('Granting Minter to new UniswapPCVDeposit') : undefined;
  await core.grantMinter(deposit.address);

  logging ? console.log('Granting Burner to new TribeReserveStabilizer') : undefined;
  await core.grantBurner(tribeReserveStabilizer.address);

  // special role
  // check via tribe contract
  logging ? console.log('Transferring TRIBE Minter role to TribeReserveStabilizer') : undefined;
  await tribe.setMinter(tribeReserveStabilizer.address, {from: timelockAddress});

  logging ? console.log('Granting Burner to new EthReserveStabilizer') : undefined;
  await core.grantBurner(ethReserveStabilizer.address);

  // 2
  logging ? console.log('Granting PCVController to new RatioPCVController') : undefined;
  await core.grantPCVController(ratioController.address);

  // 3
  logging ? console.log('Granting PCVController to new PCVDripController') : undefined;
  await core.grantPCVController(pcvDripController.address);

  logging ? console.log('Removing UniswapIncentive contract') : undefined;
  await fei.setIncentiveContract(ethPairAddress, ZERO_ADDRESS);

  // TODO: this reverts with no reason
  // await ratioController.withdrawRatio(oldUniswapPCVDepositAddress, ethUniswapPCVDepositAddress, '10000'); // move 100% of PCV from old -> new
}

////  --------------------- NOT RUN ON CHAIN ----------------------
async function revokeOldContractPerms(core, oldContractAddresses) {
  const {
    oldUniswapPCVDepositAddress,
    oldUniswapPCVControllerAddress,
    oldTribeReserveStabilizerAddress,
    oldEthReserveStabilizerAddress,
    oldRatioControllerAddress,
    deployAddress,
    oldBondingCurveAddress,
  } = oldContractAddresses;

  // Revoke controller permissions
  await core.revokeMinter(oldUniswapPCVControllerAddress);
  await core.revokeMinter(oldUniswapPCVDepositAddress);
  await core.revokeMinter(oldBondingCurveAddress);
  await core.revokeMinter(deployAddress);

  await core.revokeBurner(oldUniswapPCVControllerAddress);
  await core.revokeBurner(oldTribeReserveStabilizerAddress);
  await core.revokeBurner(oldEthReserveStabilizerAddress);
  await core.revokeBurner(deployAddress);

  await core.revokePCVController(oldRatioControllerAddress);
  await core.revokePCVController(oldUniswapPCVControllerAddress);
  await core.revokePCVController(deployAddress);

  await core.revokeGovernor(deployAddress);
}

module.exports = { upgrade, revokeOldContractPerms };
