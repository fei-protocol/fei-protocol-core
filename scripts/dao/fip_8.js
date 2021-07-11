const EthReserveStabilizer = artifacts.require('EthReserveStabilizer');
const EthBondingCurve = artifacts.require('EthBondingCurve');
const UniswapPCVController = artifacts.require('UniswapPCVController');
const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');

const { getAddresses } = require('../utils/helpers');
const { sudo } = require('../utils/sudo');

const { 
  chainlinkEthUsdOracleWrapper, 
  ethBondingCurveAddress, 
  ethReserveStabilizerAddress, 
  ethUniswapPCVDepositAddress, 
  ethUniswapPCVControllerAddress 
} = getAddresses();

/*
 DAO Proposal Steps
    1. Set oracle to chainlink on EthBondingCurve
    2. Set oracle to chainlink on EthReserveStabilizer
    3. Set oracle to chainlink on EthUniswapPCVDeposit
    4. Set oracle to chainlink on EthUniswapPCVController
*/

// The steps that don't form part of the proposal but need to be mocked up
async function setup() {
  await sudo();
}

// The actual steps in the proposal
async function runProposalSteps() {
  const ethBondingCurve = await EthBondingCurve.at(ethBondingCurveAddress);
  const ethReserveStabilizer = await EthReserveStabilizer.at(ethReserveStabilizerAddress);
  const ethUniswapPCVDeposit = await UniswapPCVDeposit.at(ethUniswapPCVDepositAddress);
  const ethUniswapPCVController = await UniswapPCVController.at(ethUniswapPCVControllerAddress);

  // 1. Set oracle to chainlink on EthBondingCurve
  console.log('Setting oracle on EthBondingCurve');
  await ethBondingCurve.setOracle(chainlinkEthUsdOracleWrapper);

  // 2. Set oracle to chainlink on EthReserveStabilizer
  console.log('Setting oracle on EthReserveStabilizer');
  await ethReserveStabilizer.setOracle(chainlinkEthUsdOracleWrapper);

  // 3. Set oracle to chainlink on EthUniswapPCVDeposit
  console.log('Setting oracle on EthUniswapPCVDeposit');
  await ethUniswapPCVDeposit.setOracle(chainlinkEthUsdOracleWrapper);

  // 4. Set oracle to chainlink on EthUniswapPCVController
  console.log('Setting oracle on EthUniswapPCVController');
  await ethUniswapPCVController.setOracle(chainlinkEthUsdOracleWrapper);
}

async function main() {
  await setup();
  await runProposalSteps();
}

module.exports = { main };

// Run setup
// setup()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

// Run full script
// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
