
const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const GenesisGroup = artifacts.require("GenesisGroup");
const Fei = artifacts.require("Fei");
const Tribe = artifacts.require("Tribe");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const BondingCurveOracle = artifacts.require("BondingCurveOracle");
const UniswapIncentive = artifacts.require("UniswapIncentive");
const FeiRouter = artifacts.require("FeiRouter");
const Core = artifacts.require("Core");
const IDO = artifacts.require("IDO");
const FeiStakingRewards = artifacts.require("FeiStakingRewards");



module.exports = async function(callback) {
  let accounts = await web3.eth.getAccounts();

  let co = await CoreOrchestrator.deployed();
  let core = await Core.at(await co.core());
  let genesisGroup = await GenesisGroup.at(await co.genesisGroup());
  let uniswapIncentive = await UniswapIncentive.at(await co.uniswapIncentive());
  let bondingCurveOracle = await BondingCurveOracle.at(await co.bondingCurveOracle());
  let feiRouter = await FeiRouter.at(await co.feiRouter());
  let fei = await Fei.at(await core.fei());
  let tribe = await Tribe.at(await core.tribe());
  let feiStakingRewards = await FeiStakingRewards.at(await co.feiStakingRewards());

  let ido = await IDO.at(await co.ido());
  let feiTribeUniswapV2Pair = await IUniswapV2Pair.at(await ido.pair());   

  console.log(JSON.stringify({
      GenesisGroup: genesisGroup.address,
      UniswapIncentive: uniswapIncentive.address,
      BondingCurveOracle: bondingCurveOracle.address,
      FeiRouter: feiRouter.address,
      Fei: fei.address,
      Tribe: tribe.address,
      FeiTribeUniswapV2Pair: feiTribeUniswapV2Pair.address,
      FeiStakingRewards: feiStakingRewards.address,
  }, null, 2));

  callback();
}