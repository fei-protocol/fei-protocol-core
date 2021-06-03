const { BN, time } = require('@openzeppelin/test-helpers');
require('@openzeppelin/test-helpers/configure')({
    provider: 'http://localhost:7545',
});

const FEI = artifacts.require('FEI');
const DAI = artifacts.require('DAI');
const WETH = artifacts.require('WETH');
const PCVSwapperUniswap = artifacts.require('PCVSwapperUniswap');
const ChainlinkOracleWrapper = artifacts.require('ChainlinkOracleWrapper');
const EthPCVDripper = artifacts.require('EthPCVDripper');
const Core = artifacts.require('Core');
const e18 = '000000000000000000';

// A validation script to make sure after the DAO steps are run that the necessary state updates are made
module.exports = async function(callback) {
  require('dotenv').config();
  const accounts = await web3.eth.getAccounts();

  const feiAddress = process.env.MAINNET_FEI;
  const dripperAddress = process.env.MAINNET_ETH_PCV_DRIPPER;
  const oracleAddress = process.env.MAINNET_CHAINLINK_ORACLE_ETH;
  const swapperAddress = process.env.MAINNET_SWAPPER_ETH_DAI;
  const coreAddress = process.env.MAINNET_CORE;

  const dripper = await EthPCVDripper.at(dripperAddress);
  const oracle = await ChainlinkOracleWrapper.at(oracleAddress);
  const swapper = await PCVSwapperUniswap.at(swapperAddress);
  const core = await Core.at(coreAddress);
  const fei = await FEI.at(feiAddress);
  const weth = await WETH.at('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
  const dai = await DAI.at('0x6b175474e89094c44da98b954eedeac495271d0f');

  // checks
  check(await core.isMinter(swapperAddress), 'Swapper is Minter');
  check(Number(await dai.balanceOf(swapperAddress)) === 0, 'Start with 0 DAI');
  check((await weth.balanceOf(swapperAddress)) / 1e18 === 40000, 'Start with 40k WETH');
  await printBalance('DAI', dai, swapperAddress);
  await printBalance('WETH', weth, swapperAddress);
  await time.increase(await swapper.remainingTime());
  console.log('swap');
  const feiBalanceBeforeSwap = (await fei.balanceOf(accounts[0])) / 1e18;
  console.log('feiBalanceBeforeSwap', feiBalanceBeforeSwap);
  await swapper.swap();
  const feiBalanceAfterSwap = (await fei.balanceOf(accounts[0])) / 1e18;
  console.log('feiBalanceAfterSwap', feiBalanceAfterSwap);
  check((feiBalanceAfterSwap - feiBalanceBeforeSwap) === 50, '50 FEI incentive on swap call');
  await printBalance('DAI', dai, swapperAddress);
  await printBalance('WETH', weth, swapperAddress);
  check((await weth.balanceOf(swapperAddress)) / 1e18 === 39960, 'Spent 40 WETH on swap');

  callback();
}

async function printBalance(prefix, token, address) {
  const balance = await token.balanceOf(address);
  console.log(prefix, 'balance:', balance / 1e18);
}

function check(flag, message) {
  if (flag) {
    console.log('PASS: ' + message)
  } else {
    console.log('FAIL: ' + message)
    throw 'FAIL: ' + message;
  }
}
