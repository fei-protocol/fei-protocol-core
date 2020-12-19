const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const UniswapOracle = artifacts.require("UniswapOracle");
const GenesisGroup = artifacts.require("GenesisGroup");
const GenesisOrchestrator = artifacts.require("GenesisOrchestrator");

module.exports = async function(callback) {
  let accounts = await web3.eth.getAccounts();
  let core = await CoreOrchestrator.deployed();
  let go = await GenesisOrchestrator.deployed();
  let gg = await GenesisGroup.at(await go.genesisGroup());
  let uo = await UniswapOracle.at(await core.uniswapOracle());

  await uo.update();
  console.log(await uo.read());
  await gg.purchase(accounts[0], 1000, {from: accounts[0], value: 1000});
  console.log(await gg.balanceOf(accounts[0]));
  callback();
}