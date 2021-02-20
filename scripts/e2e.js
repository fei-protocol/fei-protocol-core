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
const UniswapIncentive = artifacts.require("UniswapIncentive");
const FeiRouter = artifacts.require("FeiRouter");

module.exports = async function(callback) {
  let accounts = await web3.eth.getAccounts();
  let co = await CoreOrchestrator.deployed();
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
  let ui = await UniswapIncentive.at(await co.uniswapIncentive());
  let controller = await EthUniswapPCVController.at(await co.ethUniswapPCVController());
  let router = await FeiRouter.at(await co.feiRouter());

  console.log('Init');
  let ethAmount = new BN('100000000000000000000000');

  let ggPurchase = await gg.purchase(accounts[0], ethAmount, {from: accounts[0], value: ethAmount});
  let ggPurchaseGas = ggPurchase['receipt']['gasUsed'];
  console.log(`Genesis Group Purchase of ${stringify(ethAmount)}`); 
  

  let ggCommit = await gg.commit(accounts[0], accounts[0], ethAmount.div(new BN('2')), {from: accounts[0]});
  let ggCommitGas = ggCommit['receipt']['gasUsed'];
  console.log(`Genesis Group Commit of ${stringify(ethAmount)} / 2`); 

  console.log('Sleeping for 60s');
  await sleep(60000);
  await uo.update();
  let price = await uo.read();
  console.log(`Uniswap Oracle: price ${price[0] / 1e18}`);

  let launch = await gg.launch({from: accounts[0]});
  let launchGas = launch['receipt']['gasUsed'];
  let coreComplete = await core.hasGenesisGroupCompleted();
  let bcoInitPrice = await bco.initialPrice();
  let ggFei = await fei.balanceOf(await gg.address);
  let ggTribe = await tribe.balanceOf(await gg.address);
  console.log(`GG Launch: complete=${coreComplete}, initPrice= ${bcoInitPrice / 1e18}, fei=${stringify(ggFei)}, tribe=${stringify(ggTribe)}`); 

  let redeem = await gg.redeem(accounts[0]);
  let redeemGas = redeem['receipt']['gasUsed'];
  let redeemFei = await fei.balanceOf(accounts[0]);
  let redeemTribe = await tribe.balanceOf(accounts[0]);
  console.log(`GG Redeem: fei=${stringify(redeemFei)}, tribe=${stringify(redeemTribe)}`);

  let idoReserves = await ido.getReserves();
  let feiIdoReserves = idoReserves[0];
  let tribeIdoReserves = idoReserves[1];
  let idoTotalLiquidity  = await pair.totalSupply();

  //
  // setPendingBeneficiary(
  // Accept beneficiary
  // ido.release


  // addLiquidity(
  // use interface iUniswapV2Router02
  //
  console.log(`IDO Reserves: fei=${stringify(feiIdoReserves)}, tribe=${stringify(tribeIdoReserves)}, liquidity=${stringify(idoTotalLiquidity)}`);
  let idoRedeem = await ido.release({from: accounts[0]});
  let idoRedeemGas = idoRedeem['receipt']['gasUsed'];
  let idoLiquidity = await pair.balanceOf(accounts[0]);

  console.log(`IDO Redeem: liquidity=${stringify(idoLiquidity)}`);

  let adminPreRedeemedTribe = await tribe.balanceOf(accounts[0]);
  let adminTribeRedeem = await td.release({from: accounts[0]})
  let adminTribeRedeemGas = adminTribeRedeem['receipt']['gasUsed'];
  let adminPostRedeemedTribe = await tribe.balanceOf(accounts[0]);
  let adminNetRedeemed = adminPostRedeemedTribe.sub(adminPreRedeemedTribe);
  console.log(`admin TRIBE claim: pre=${stringify(adminPreRedeemedTribe)}, post=${stringify(adminPostRedeemedTribe)}, net=${stringify(adminNetRedeemed)}`);

  let preTimelockedTribe = await tribe.balanceOf(await td.address);
  let adminDelegation = await td.delegate(accounts[1], ethAmount, {from: accounts[0]});
  let adminDelegationGas = adminDelegation['receipt']['gasUsed'];
  let adminDelegatedVotes = await tribe.getCurrentVotes(accounts[1]);
  let remainingTimelockedTribe = await tribe.balanceOf(await td.address);
  console.log(`TRIBE delegation: preBalance=${stringify(preTimelockedTribe)}, postBalance=${stringify(remainingTimelockedTribe)}, delegated=${stringify(adminDelegatedVotes)}`);

  let pairBalance = await pair.balanceOf(accounts[0]);
  await pair.approve(await pool.address, pairBalance, {from: accounts[0]});
  let staked = await pool.deposit(accounts[0], pairBalance, {from: accounts[0]});
  let stakedGas = staked['receipt']['gasUsed'];
  let poolBalance = await pool.balanceOf(accounts[0]);
  console.log(`Staking pool stake: pool=${stringify(poolBalance)}`);

  let atScale = await bc.atScale();
  let feiBefore = await fei.balanceOf(accounts[0]);
  let triple = ethAmount.mul(new BN('3'));
  let preScaleBCPurchase = await bc.purchase(accounts[0], triple, {from: accounts[0], value: triple});
  let preScaleBCGas = preScaleBCPurchase['receipt']['gasUsed'];
  let feiAfter = await fei.balanceOf(accounts[0]);
  let netFei = feiAfter.sub(feiBefore);
  console.log(`Bonding Curve Purchase Pre: eth=${stringify(triple)}, fei=${stringify(netFei)} atScaleBefore=${atScale}`);

  atScale = await bc.atScale();
  feiBefore = await fei.balanceOf(accounts[0]);
  let postScaleBCPurchase = await bc.purchase(accounts[0], ethAmount, {from: accounts[0], value: ethAmount});
  let postScaleBCGas = postScaleBCPurchase['receipt']['gasUsed'];
  feiAfter = await fei.balanceOf(accounts[0]);
  netFei = feiAfter.sub(feiBefore);
  console.log(`Bonding Curve Purchase Post: eth=${stringify(ethAmount)}, fei=${stringify(netFei)} atScaleBefore=${atScale}`);

  feiBefore = await fei.balanceOf(accounts[0]);
  let tenX = ethAmount.mul(new BN('10'));
  await fei.approve(await router.address, tenX, {from: accounts[0]});
  let feiSell = await router.sellFei(tenX, ethAmount, 0, accounts[0], ethAmount, {from: accounts[0]});
  let feiSellGas = feiSell['receipt']['gasUsed'];
  feiAfter = await fei.balanceOf(accounts[0]);
  let burned = feiBefore.sub(feiAfter).sub(tenX);
  console.log(`Uni Sell: amt=${stringify(tenX)}, burned=${stringify(burned)}`);

  let poolBeforeClaim = await pool.balanceOf(accounts[0]);
  let tribeBeforeClaim = await tribe.balanceOf(accounts[0]);
  let claimed = await pool.claim(accounts[0], accounts[0], {from: accounts[0]});
  let claimedGas = claimed['receipt']['gasUsed'];
  let poolAfterClaim = await pool.balanceOf(accounts[0]);
  let tribeAfterClaim = await tribe.balanceOf(accounts[0]);
  let poolBurned = poolBeforeClaim.sub(poolAfterClaim);
  let tribeEarned = tribeAfterClaim.sub(tribeBeforeClaim);
  console.log(`Claim: poolBurned=${stringify(poolBurned)}, tribeEarned=${stringify(tribeEarned)}`);

  console.log('Sleeping for 10s');
  sleep(10000);

  let pairBeforeWithdraw = await pair.balanceOf(accounts[0]);
  let withdraw = await pool.withdraw(accounts[0], {from: accounts[0]});
  let withdrawGas = withdraw['receipt']['gasUsed'];
  let poolAfterWithdraw = await pool.balanceOf(accounts[0]);
  let pairAfterWithdraw = await pair.balanceOf(accounts[0]);

  console.log(`Withdraw: pool=${stringify(poolAfterWithdraw)}, pairBefore=${stringify(pairBeforeWithdraw)}, pairAfter=${stringify(pairAfterWithdraw)}`);

  console.log(`Gas:`);
  console.log(`GenesisGroup: purchase=${ggPurchaseGas}, launch=${launchGas}, redeem: ${redeemGas}, commit: ${ggCommitGas}`);
  console.log(`Admin: idoRedeem=${idoRedeemGas}, tribeRedeem=${adminTribeRedeemGas}, tribeDelegation=${adminDelegationGas}`);
  console.log(`Bonding Curve: pre=${preScaleBCGas}, post=${postScaleBCGas}`);
  console.log(`Uni: sell=${feiSellGas}`);
  console.log(`Pool: stake=${stakedGas}, claim=${claimedGas}, withdraw=${withdrawGas}`);
  callback();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stringify(bn) {
  let decimals = new BN('1000000000000000000');
  return bn.div(decimals).toString();
}
