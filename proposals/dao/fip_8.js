/*
 DAO Proposal Steps
    1. Set oracle to chainlink on EthBondingCurve
    2. Set oracle to chainlink on EthReserveStabilizer
    3. Set oracle to chainlink on EthUniswapPCVDeposit
    4. Set oracle to chainlink on EthUniswapPCVController
*/

// The steps that don't form part of the proposal but need to be mocked up
async function setup(addresses, oldContracts, contracts, logging) {}

// The actual steps in the proposal
async function run(addresses, oldContracts, contracts, logging = false) {
  const { bondingCurve, ethReserveStabilizer, uniswapPCVDeposit, uniswapPCVController } = contracts;

  const { chainlinkEthUsdOracleWrapperAddress } = addresses;

  // 1. Set oracle to chainlink on EthBondingCurve
  logging ? console.log('Setting oracle on EthBondingCurve') : undefined;
  await bondingCurve.setOracle(chainlinkEthUsdOracleWrapperAddress);

  // 2. Set oracle to chainlink on EthReserveStabilizer
  logging ? console.log('Setting oracle on EthReserveStabilizer') : undefined;
  await ethReserveStabilizer.setOracle(chainlinkEthUsdOracleWrapperAddress);

  // 3. Set oracle to chainlink on UniswapPCVDeposit
  logging ? console.log('Setting oracle on UniswapPCVDeposit') : undefined;
  await uniswapPCVDeposit.setOracle(chainlinkEthUsdOracleWrapperAddress);

  // 4. Set oracle to chainlink on UniswapPCVController
  logging ? console.log('Setting oracle on UniswapPCVController') : undefined;
  await uniswapPCVController.setOracle(chainlinkEthUsdOracleWrapperAddress);
}

async function teardown(addresses, oldContracts, contracts, logging) {}

module.exports = { setup, run, teardown };
