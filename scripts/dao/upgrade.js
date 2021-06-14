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

const { getAddresses } = require('../utils/helpers');

const {
  coreAddress,
  ethUniswapPCVDepositAddress,
  ethUniswapPCVControllerAddress,
  ethBondingCurveAddress,
  ethReserveStabilizerAddress,
  tribeReserveStabilizerAddress,
  ratioPCVControllerAddress,
  pcvDripControllerAddress,
  ethPairAddress,
  timelockAddress
} = getAddresses();

// The DAO steps for upgrading to ERC20 compatible versions, these must be done with Governor access control privileges
async function main() {
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

  console.log('Granting Burner to new UniswapPCVController');
  await core.grantBurner(controller.address);

  console.log('Granting Minter to new UniswapPCVController');
  await core.grantMinter(controller.address);

  console.log('Granting Minter to new BondingCurve');
  await core.grantMinter(bondingCurve.address);

  console.log('Granting Minter to new UniswapPCVDeposit');
  await core.grantMinter(deposit.address);

  console.log('Granting Burner to new TribeReserveStabilizer');
  await core.grantBurner(tribeReserveStabilizer.address);

  console.log('Transferring TRIBE Minter role to TribeReserveStabilizer');
  await tribe.setMinter(tribeReserveStabilizer.address, {from: timelockAddress});

  console.log('Granting Burner to new EthReserveStabilizer');
  await core.grantBurner(ethReserveStabilizer.address);

  console.log('Granting PCVController to new RatioPCVController');
  await core.grantPCVController(ratioController.address);

  console.log('Granting PCVController to new PCVDripController');
  await core.grantPCVController(pcvDripController.address);

  console.log('Removing UniswapIncentive contract');
  await fei.setIncentiveContract(ethPairAddress, ZERO_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
