const { web3 } = require('hardhat');
const fipEight = require('../dao/fip_8');

const EthReserveStabilizer = artifacts.require('EthReserveStabilizer');
const EthBondingCurve = artifacts.require('EthBondingCurve');
const UniswapPCVController = artifacts.require('UniswapPCVController');
const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');
const ChainlinkOracleWrapper = artifacts.require('ChainlinkOracleWrapper');

const { check, getAddresses, readOracle } = require('../utils/helpers');

const { 
  chainlinkEthUsdOracleWrapperAddress, 
  ethBondingCurveAddress, 
  ethReserveStabilizerAddress, 
  ethUniswapPCVDepositAddress, 
  ethUniswapPCVControllerAddress 
} = getAddresses();

async function getState() {
  const chainlinkEthUsdOracleWrapper = await ChainlinkOracleWrapper.at(
    chainlinkEthUsdOracleWrapperAddress
  );
  const ethBondingCurve = await EthBondingCurve.at(ethBondingCurveAddress);
  const ethReserveStabilizer = await EthReserveStabilizer.at(ethReserveStabilizerAddress);
  const ethUniswapPCVDeposit = await UniswapPCVDeposit.at(ethUniswapPCVDepositAddress);
  const ethUniswapPCVController = await UniswapPCVController.at(ethUniswapPCVControllerAddress); 
  
  const bondingCurveOracle = await ethBondingCurve.oracle();
  const bondingCurveOracleValue = await readOracle(ethBondingCurve, web3);
  const stabilizerOracle = await ethReserveStabilizer.oracle();
  const stabilizerOracleValue = await readOracle(ethReserveStabilizer, web3);
  const uniswapPCVDepositOracle = await ethUniswapPCVDeposit.oracle();
  const uniwapPCVDepositOracleValue = await readOracle(ethUniswapPCVDeposit, web3);
  const uniswapPCVControllerOracle = await ethUniswapPCVController.oracle();
  const uniswapPCVControllerValue = await readOracle(ethUniswapPCVController, web3);

  const chainlinkOracleValue = (await chainlinkEthUsdOracleWrapper.read())[0][0];
  const chainlinkOracleValid = (await chainlinkEthUsdOracleWrapper.read())[1];
  return {
    chainlinkOracleValid,
    chainlinkOracleValue,
    bondingCurveOracle,
    bondingCurveOracleValue,
    stabilizerOracle,
    stabilizerOracleValue,
    uniswapPCVDepositOracle,
    uniwapPCVDepositOracleValue,
    uniswapPCVControllerOracle,
    uniswapPCVControllerValue,
  };
}

async function validateState(newState) {
  const {
    chainlinkOracleValid,
    chainlinkOracleValue,
    bondingCurveOracle,
    bondingCurveOracleValue,
    stabilizerOracle,
    stabilizerOracleValue,
    uniswapPCVDepositOracle,
    uniwapPCVDepositOracleValue,
    uniswapPCVControllerOracle,
    uniswapPCVControllerValue,
  } = newState;

  check(chainlinkOracleValid, 'Chainlink oracle returning invalid');

  check(bondingCurveOracle === chainlinkEthUsdOracleWrapperAddress, 'Bonding curve oracle unchanged');
  check(stabilizerOracle === chainlinkEthUsdOracleWrapperAddress, 'Stabilizer oracle unchanged');
  check(uniswapPCVDepositOracle === chainlinkEthUsdOracleWrapperAddress, 'PCV deposit oracle unchanged');
  check(uniswapPCVControllerOracle === chainlinkEthUsdOracleWrapperAddress, 'PCV controller oracle unchanged');

  check(bondingCurveOracleValue === chainlinkOracleValue, 'Bonding curve oracle value mismatch');
  check(stabilizerOracleValue === chainlinkOracleValue, 'Stabilizer oracle value mismatch');
  check(uniwapPCVDepositOracleValue === chainlinkOracleValue, 'PCV deposit oracle value mismatch');
  check(uniswapPCVControllerValue === chainlinkOracleValue, 'PCV controller oracle value mismatch');
}

// Runs the fip-8 script with before+after validation
async function fullLocalValidation() { // eslint-disable-line
  const stateBeforeFipEight = await getState();
  console.log('State before FIP-8:', JSON.stringify(stateBeforeFipEight, null, 2));

  console.log('Running FIP-8 execution script...');
  await fipEight.main();
  console.log('Finished running FIP-8 execution script.');

  const stateAfterFipEight = await getState();
  console.log('State after FIP-8:', JSON.stringify(stateAfterFipEight, null, 2), '\n');

  await validateState(stateAfterFipEight);
}

// Runs validation assuming fip-8 has already been executed
async function postFipValidation() { // eslint-disable-line
  const stateAfterFipEight = await getState();
  console.log('State after FIP-8:', JSON.stringify(stateAfterFipEight, null, 2), '\n');

  await validateState(stateAfterFipEight);
}

// fullLocalValidation()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

// postFipValidation()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
