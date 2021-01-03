const { BN } = require("@openzeppelin/test-helpers/src/setup");

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
const BondingCurveOracle = artifacts.require("BondingCurveOracle");
const EthUniswapPCVController = artifacts.require("EthUniswapPCVController");

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
  let bco = await BondingCurveOracle.at(await co.bondingCurveOracle());
  let controller = await EthUniswapPCVController.at(await co.ethUniswapPCVController());

  console.log('Init');
  let ethAmount = new BN('100000000000000000000000');

  let ggPurchase = await gg.purchase(accounts[0], ethAmount, {from: accounts[0], value: ethAmount});
  let ggPurchaseGas = ggPurchase['receipt']['gasUsed'];
  console.log(`Genesis Group Purchase of ${stringify(ethAmount)}: gas ${ggPurchaseGas}`); 
  
  console.log('Sleeping for 60s');
  await sleep(60000);
  await uo.update();
  let price = await uo.read();
  console.log(`Oracles: price ${price[0] / 1e18}`);

  let bcAdjusted = await bc.getAdjustedAmount(ethAmount);
  let amountOut = await bc._getBondingCurveAmountOut(bcAdjusted);
  let bcPrice = await bc.getAveragePrice(ethAmount);
  console.log(`BC avg=${bcPrice}, adjusted=${bcAdjusted}, amtOut=${amountOut}`);

  let launch = await gg.launch({from: accounts[0]});
  let launchGas = launch['receipt']['gasUsed'];
  let coreComplete = await core.hasGenesisGroupCompleted();
  let bcoInitPrice = await bco.initialPrice();
  let ggFei = await fei.balanceOf(await gg.address);
  let ggTribe = await tribe.balanceOf(await gg.address);
  let deployRatio = ggFei.div(ggTribe).div(new BN(10));
  console.log(`Launch: gas=${launchGas}, complete=${coreComplete}, initPrice= ${bcoInitPrice}, fei=${stringify(ggFei)}, tribe=${stringify(ggTribe)}, deployRatio=${deployRatio}`); 


  console.log('User Fei/Total Supply, Tribe balance:');
  console.log(await fei.balanceOf(accounts[0]));
  console.log(await fei.totalSupply());
  console.log(await tribe.balanceOf(accounts[0]));
  console.log('Redeem (gas, user fei, user tribe):');
  let redeem = await gg.redeem(accounts[0]);
  console.log(redeem['receipt']['gasUsed']);
  console.log(await fei.balanceOf(accounts[0]));
  console.log(await tribe.balanceOf(accounts[0]));

  let idoReserves = await ido.getReserves();

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
  let delegation = await td.delegate(accounts[1], ethAmount, {from: accounts[0]});
  console.log(delegation['receipt']['gasUsed']);
  console.log(await tribe.getCurrentVotes(accounts[1]));
  console.log(await tribe.balanceOf(await td.address));

  console.log('Pair minting');
  await fei.transfer(await pair.address, ethAmount, {from: accounts[0]});
  await tribe.transfer(await pair.address, '10000000000000000000000', {from: accounts[0]});
  await pair.mint(accounts[0], {from: accounts[0]});
  let pairBalance = await pair.balanceOf(accounts[0]);
  console.log(pairBalance);

  console.log('Staking pool stake: + fpool');
  await pair.approve(await pool.address, pairBalance, {from: accounts[0]});
  let staked = await pool.deposit(accounts[0], pairBalance, {from: accounts[0]});
  console.log(staked['receipt']['gasUsed']);
  console.log(await pool.balanceOf(accounts[0]));
  console.log('Bonding Curve Purchase + before/afer at scale + balances');
  console.log(await bc.atScale());
  console.log(await fei.balanceOf(accounts[0]));

  let bcPurchase = await bc.purchase(accounts[0], '300000000000000000000000', {from: accounts[0], value: '300000000000000000000000'});
  console.log(bcPurchase['receipt']['gasUsed']);
  console.log(await bc.atScale());
  console.log(await fei.balanceOf(accounts[0]));
  
  bcPurchase = await bc.purchase(accounts[0], ethAmount, {from: accounts[0], value: ethAmount});
  console.log(bcPurchase['receipt']['gasUsed']);
  console.log(await bc.atScale());
  console.log(await fei.balanceOf(accounts[0]));
  console.log('Uni Sell below peg transfer burn');
  let beforeBalance = await fei.balanceOf(accounts[0]);

  let feiSell = await fei.transfer(await ethPair.address, '1000000000000000000000000', {from: accounts[0]});
  console.log(feiSell['receipt']['gasUsed']);
  let afterBalance = await fei.balanceOf(accounts[0]);
  console.log(beforeBalance.sub(afterBalance));
  console.log('Claim + pool fei before/after');
  console.log(await pool.balanceOf(accounts[0]));
  await fei.approve(await pool.address, ethAmount, {from: accounts[0]});
  let claimed = await pool.claim(accounts[0], accounts[0], {from: accounts[0]});
  console.log(claimed['receipt']['gasUsed']);
  console.log(await pool.balanceOf(accounts[0]));
  callback();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stringify(bn) {
  let decimals = new BN('1000000000000000000');
  return bn.div(decimals).toString();
}
