const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const IERC20 = artifacts.require("IERC20");
const IWETH = artifacts.require("IWETH");

module.exports = async function(callback) {
  let accounts = await web3.eth.getAccounts();
  let core = await CoreOrchestrator.deployed();
  let ef = await IUniswapV2Pair.at(await core.ethFeiPair());
  let weth = await IWETH.at("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
  let weth2 = await IERC20.at("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

  await weth.deposit({value: "1000", from: accounts[0]});
  await weth2.transfer(ef.address, 1000, {from: accounts[0]});

  await ef.sync();
  let reserves = await ef.getReserves();
  console.log(reserves);
  callback();
}