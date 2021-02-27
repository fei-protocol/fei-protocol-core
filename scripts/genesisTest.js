const { BN, ether } = require('@openzeppelin/test-helpers');

const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const GenesisGroup = artifacts.require("GenesisGroup");
const IDO = artifacts.require("IDO");
const Core = artifacts.require("Core");
const Fei = artifacts.require("Fei");
const Tribe = artifacts.require("Tribe");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");

const UniswapOracle = artifacts.require("UniswapOracle");
const BondingCurveOracle = artifacts.require("BondingCurveOracle");

// Assumes the following:
// Genesis 60 seconds
// Scale = 100,000,000 FEI
// oracle update twap window is every second

module.exports = async function(callback) {
//   let accounts = await web3.eth.getAccounts();
//   let co = await CoreOrchestrator.deployed();
//   let core = await Core.at(await co.core());
//   let fei = await Fei.at(await core.fei());
//   let tribe = await Tribe.at(await core.tribe());
//   let ido = await IDO.at(await co.ido());
//   let pair = await IUniswapV2Pair.at(await ido.pair());

//   let ethPair = await IUniswapV2Pair.at(await co.ethFeiPair());
//   let uo = await UniswapOracle.at(await co.uniswapOracle());
//   let bco = await BondingCurveOracle.at(await co.bondingCurveOracle());

//   console.log('Init Genesis');
//   await co.initGenesis();

//   await sleep(1000);
//   await uo.update();
//   let price = await uo.read();
//   console.log(`Uniswap Oracle: price ${price[0] / 1e18}`);

//   let gg = await GenesisGroup.at(await co.genesisGroup());

//   let ethAmount = new BN('1000000000000000000');
//   console.log(ethAmount);
  console.log(ether(new BN('1')));

//   let ggPurchase = await gg.purchase(accounts[0], ethAmount, {from: accounts[0], value: ethAmount});
//   let ggPurchaseGas = ggPurchase['receipt']['gasUsed'];
//   console.log(`Genesis Group Purchase of ${stringify(ethAmount)}`); 
  

//   let ggCommit = await gg.commit(accounts[0], accounts[0], ethAmount.div(new BN('2')), {from: accounts[0]});
//   let ggCommitGas = ggCommit['receipt']['gasUsed'];
//   console.log(`Genesis Group Commit of ${stringify(ethAmount)} / 2`); 

//   console.log('Sleeping for 60s');

//   let launch = await gg.launch({from: accounts[0]});
//   let launchGas = launch['receipt']['gasUsed'];
//   let coreComplete = await core.hasGenesisGroupCompleted();
//   let bcoInitPrice = await bco.initialPrice();
//   let ggFei = await fei.balanceOf(await gg.address);
//   let ggTribe = await tribe.balanceOf(await gg.address);
//   console.log(`GG Launch: complete=${coreComplete}, initPrice= ${bcoInitPrice / 1e18}, fei=${stringify(ggFei)}, tribe=${stringify(ggTribe)}`); 

//   let redeem = await gg.redeem(accounts[0]);
//   let redeemGas = redeem['receipt']['gasUsed'];
//   let redeemFei = await fei.balanceOf(accounts[0]);
//   let redeemTribe = await tribe.balanceOf(accounts[0]);
//   console.log(`GG Redeem: fei=${stringify(redeemFei)}, tribe=${stringify(redeemTribe)}`);

//   let idoReserves = await ido.getReserves();
//   let feiIdoReserves = idoReserves[0];
//   let tribeIdoReserves = idoReserves[1];
//   let idoTotalLiquidity = await pair.totalSupply();

//   console.log(`IDO Reserves: fei=${stringify(feiIdoReserves)}, tribe=${stringify(tribeIdoReserves)}, liquidity=${stringify(idoTotalLiquidity)}`);
//   await ido.release(accounts[0], '1', {from: accounts[0]}); //poke

//   let idoReleaseAmount = await ido.availableForRelease();
//   let idoRedeem = await ido.release(accounts[0], idoReleaseAmount, {from: accounts[0]});
//   let idoRedeemGas = idoRedeem['receipt']['gasUsed'];
//   let idoLiquidity = await pair.balanceOf(accounts[0]);

//   console.log(`IDO Redeem: liquidity=${stringify(idoLiquidity)}`);

  callback();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stringify(bn) {
  let decimals = new BN('1000000000000000000');
  return bn.div(decimals).toString();
}
