const Core = artifacts.require("Core");
const Fei = artifacts.require("Fei");
const EthBondingCurve = artifacts.require("EthBondingCurve");

module.exports = async function(callback) {
  console.log('initializing test environment');
  let accounts = await web3.eth.getAccounts();
  let core = await Core.deployed();
  let fei = await Fei.deployed();
  let bc = await EthBondingCurve.deployed();

  await bc.purchase("1000000000000000000", accounts[0], {value: "1000000000000000000"});

  let balance = await fei.balanceOf(accounts[0]);
  let eth = await web3.eth.getBalance(bc.address);
  console.log(balance);
  console.log(eth);
  callback();
}