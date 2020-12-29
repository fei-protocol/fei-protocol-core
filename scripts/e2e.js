const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const GenesisGroup = artifacts.require("GenesisGroup");
const IDO = artifacts.require("IDO");
const Core = artifacts.require("Core");
const Fei = artifacts.require("Fei");
const Tribe = artifacts.require("Tribe");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const TimelockedDelegator = artifacts.require("TimelockedDelegator");
const Pool = artifacts.require("Pool");
const EthBondingCurve = artifacts.require("EthBondingCurve");
const UniswapOracle = artifacts.require("UniswapOracle");

module.exports = async function(callback) {
  let accounts = await web3.eth.getAccounts();
  let co = await CoreOrchestrator.deployed();
  let core = await Core.at(await co.core());
  let fei = await Fei.at(await core.fei());
  let tribe = await Tribe.at(await core.tribe());
  let gg = await GenesisGroup.at(await co.genesisGroup());
  let ido = await IDO.at(await co.ido());
  let pair = await IUniswapV2Pair.at(await ido.pair());
  let td = await TimelockedDelegator.at(await co.timelockedDelegator());
  let pool = await Pool.at(await co.pool());
  let bc = await EthBondingCurve.at(await co.ethBondingCurve());
  let ethPair = await IUniswapV2Pair.at(await co.ethFeiPair());
  let uo = await UniswapOracle.at(await co.uniswapOracle());

  console.log('Init');
  let ggPurchase = await gg.purchase(accounts[0], 100000, {from: accounts[0], value: 100000});
  console.log('Genesis Group Purchase:'); 
  console.log(ggPurchase['receipt']['gasUsed']);

  console.log('Sleeping for 60s');
  await sleep(60000);
  console.log('Oracles');
  await uo.update();
  console.log(await uo.read());
  console.log('Launch:'); 
  let launch = await gg.launch({from: accounts[0]});
  console.log(launch['receipt']['gasUsed']);
  console.log('Core Genesis Complete:');
  console.log(await core.hasGenesisGroupCompleted());
  console.log('User Fei/Total Supply, Tribe balance:');
  console.log(await fei.balanceOf(accounts[0]));
  console.log(await fei.totalSupply());
  console.log(await tribe.balanceOf(accounts[0]));
  console.log('Redeem (gas, user fei, user tribe):');
  let redeem = await gg.redeem(accounts[0]);
  console.log(redeem['receipt']['gasUsed']);
  console.log(await fei.balanceOf(accounts[0]));
  console.log(await tribe.balanceOf(accounts[0]));
  console.log('IDO reserves:')
  console.log(await ido.getReserves());
  console.log('IDO redeem + updated balance/total:');
  let idoRedeem = await ido.release({from: accounts[0]});
  console.log(idoRedeem['receipt']['gasUsed']);
  let idoLiquidity = await pair.balanceOf(accounts[0]);
  console.log(idoLiquidity);
  console.log(await pair.totalSupply());
  console.log('IDO burn + updated reserves');
  await pair.transfer(await pair.address, idoLiquidity, {from: accounts[0]});
  await pair.burn(accounts[0]);
  console.log(await ido.getReserves());
  console.log('TRIBE claim: (with before + after balances)');
  console.log(await tribe.balanceOf(accounts[0]));
  let tribeRedeem = await td.release({from: accounts[0]});
  console.log(tribeRedeem['receipt']['gasUsed']);
  console.log(await tribe.balanceOf(accounts[0]));
  console.log('TRIBE delegation: (with before + after delegation/delegator balance)');
  console.log(await tribe.getCurrentVotes(accounts[1]));
  console.log(await tribe.balanceOf(await td.address));
  let delegation = await td.delegate(accounts[1], 100000, {from: accounts[0]});
  console.log(delegation['receipt']['gasUsed']);
  console.log(await tribe.getCurrentVotes(accounts[1]));
  console.log(await tribe.balanceOf(await td.address));
  console.log('Staking pool stake: + fpool');
  await fei.approve(await pool.address, 10000, {from: accounts[0]});
  let staked = await pool.deposit(10000, {from: accounts[0]});
  console.log(staked['receipt']['gasUsed']);
  console.log(await pool.balanceOf(accounts[0]));
  console.log('Bonding Curve Purchase + before/afer at scale + balances');
  console.log(await bc.atScale());
  console.log(await fei.balanceOf(accounts[0]));

  let bcPurchase = await bc.purchase(300000, accounts[0], {from: accounts[0], value: 300000});
  console.log(bcPurchase['receipt']['gasUsed']);
  console.log(await bc.atScale());
  console.log(await fei.balanceOf(accounts[0]));
  bcPurchase = await bc.purchase(100000, accounts[0], {from: accounts[0], value: 100000});
  console.log(bcPurchase['receipt']['gasUsed']);
  console.log(await bc.atScale());
  console.log(await fei.balanceOf(accounts[0]));
  console.log('Uni Sell below peg transfer burn');
  let beforeBalance = await fei.balanceOf(accounts[0]);

  let feiSell = await fei.transfer(await ethPair.address, 1000000, {from: accounts[0]});
  console.log(feiSell['receipt']['gasUsed']);
  let afterBalance = await fei.balanceOf(accounts[0]);
  console.log(beforeBalance.sub(afterBalance));
  console.log('Claim + pool fei before/after');
  console.log(await pool.balanceOf(accounts[0]));
  await fei.approve(await pool.address, 100000, {from: accounts[0]});
  let claimed = await pool.claim(accounts[0], {from: accounts[0]});
  console.log(claimed['receipt']['gasUsed']);
  console.log(await pool.balanceOf(accounts[0]));
  callback();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}