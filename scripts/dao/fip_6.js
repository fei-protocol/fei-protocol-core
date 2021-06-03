const PCVSwapperUniswap = artifacts.require("PCVSwapperUniswap");
const ChainlinkOracleWrapper = artifacts.require('ChainlinkOracleWrapper');
const EthPCVDripper = artifacts.require('EthPCVDripper');
const Core = artifacts.require("Core");
const e18 = '000000000000000000';

// The DAO steps for FIP-3, these must be done with Governor access control privileges
module.exports = async function(callback) {
  require('dotenv').config();

  let core = await Core.at(process.env.MAINNET_CORE);
  let dripper = await EthPCVDripper.at(process.env.MAINNET_ETH_PCV_DRIPPER);
  let oracle = await ChainlinkOracleWrapper.at(process.env.MAINNET_CHAINLINK_ORACLE_ETH);
  let swapper = await PCVSwapperUniswap.at(process.env.MAINNET_SWAPPER_ETH_DAI);

  console.log('Granting Minter to new Swapper');
  await core.grantMinter(process.env.MAINNET_SWAPPER_ETH_DAI);

  console.log('Set tokenReceivingAddress on the new Swapper');
  await swapper.setReceivingAddress(process.env.MAINNET_SWAPPER_ETH_DAI);

  console.log('Move 40,000 ETH from EthPCVDripper to the new Swapper');
  await dripper.withdrawETH(process.env.MAINNET_SWAPPER_ETH_DAI, '40000'+e18);

  console.log('Wrap ETH on the new Swapper');
  await swapper.wrapETH();

  console.log('Done');
  callback();
}
