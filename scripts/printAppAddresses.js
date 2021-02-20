
const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const GenesisGroup = artifacts.require("GenesisGroup");
const Fei = artifacts.require("Fei");
const Tribe = artifacts.require("Tribe");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const Pool = artifacts.require("Pool");
const BondingCurveOracle = artifacts.require("BondingCurveOracle");
const UniswapIncentive = artifacts.require("UniswapIncentive");
const FeiRouter = artifacts.require("FeiRouter");

module.exports = async function(callback) {
  let accounts = await web3.eth.getAccounts();

  let co = await CoreOrchestrator.deployed();

  let fei = await Fei.at(await core.fei());
  let tribe = await Tribe.at(await core.tribe());
  let gg = await GenesisGroup.at(await co.genesisGroup());
  let ui = await UniswapIncentive.at(await co.uniswapIncentive());
  let bco = await BondingCurveOracle.at(await co.bondingCurveOracle());
  let router = await FeiRouter.at(await co.feiRouter());
  let pool = await Pool.at(await co.pool());
  let ido = await IDO.at(await co.ido());
  let feiTribePair = await IUniswapV2Pair.at(await ido.pair());

  console.log("HELLO", fei.address);

  callback();
}