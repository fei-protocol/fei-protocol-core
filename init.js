const Core = artifacts.require("Core");
const Fii = artifacts.require("Fii");
const EthBondingCurve = artifacts.require("EthBondingCurve");

module.exports = async function(callback) {
  console.log('initializing test environment');
  let accounts = await web3.eth.getAccounts();
  let core = await Core.deployed();
  let fii = await Fii.deployed();
  let bc = await EthBondingCurve.deployed();

  await bc.purchase("1000000000000000000", accounts[0], {value: "1000000000000000000"});

  let balance = await fii.balanceOf(accounts[0]);
  let eth = await web3.eth.getBalance(bc.address);
  console.log(balance);
  console.log(eth);
  callback();
}