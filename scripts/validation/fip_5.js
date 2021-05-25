const { BN } = require('@openzeppelin/test-helpers');

const EthUniswapPCVDeposit = artifacts.require("UniswapPCVDeposit");
const EthPCVDripper = artifacts.require("EthPCVDripper");
const EthPCVDepositAdapter = artifacts.require("EthPCVDepositAdapter");
const EthBondingCurve = artifacts.require("EthBondingCurve");
const RatioPCVController = artifacts.require("RatioPCVController");
const Core = artifacts.require("Core");

// A validation script to make sure after the DAO steps are run that the necessary state updates are made
module.exports = async function(callback) {
  require('dotenv').config();

  let accounts = await web3.eth.getAccounts();

  var oldDepositAddress, newDepositAddress, coreAddress, ratioControllerAddress, adapterAddress, bondingCurveAddress, dripperAddress;
  if(process.env.TESTNET_MODE) {
    oldDepositAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_DEPOSIT_01;
    newDepositAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_DEPOSIT;
    coreAddress = process.env.RINKEBY_CORE;
    ratioControllerAddress = process.env.RINKEBY_RATIO_PCV_CONTROLLER;
    adapterAddress = process.env.RINKEBY_ETH_PCV_ADAPTER;
    bondingCurveAddress = process.env.RINKEBY_ETH_BONDING_CURVE;
    dripperAddress = process.env.RINKEBY_ETH_PCV_DRIPPER;
  } else {
    oldDepositAddress = process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT_01;
    newDepositAddress = process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT;
    coreAddress = process.env.MAINNET_CORE;
    ratioControllerAddress = process.env.MAINNET_RATIO_PCV_CONTROLLER;
    adapterAddress = process.env.MAINNET_ETH_PCV_ADAPTER;
    bondingCurveAddress = process.env.MAINNET_ETH_BONDING_CURVE;
    dripperAddress = process.env.MAINNET_ETH_PCV_DRIPPER;
  }

  let newDeposit = await EthUniswapPCVDeposit.at(newDepositAddress);
  let oldDeposit = await EthUniswapPCVDeposit.at(oldDepositAddress);
  let ratioController = await RatioPCVController.at(ratioControllerAddress);
  let adapter = await EthPCVDepositAdapter.at(adapterAddress);
  let bc = await EthBondingCurve.at(bondingCurveAddress);
  let ethPCVDripper = await EthPCVDripper.at(dripperAddress);
  let core = await Core.at(coreAddress);

  console.log("Access Control");

  let revokedOld = !(await core.isMinter(oldDeposit.address));
  console.log((revokedOld ? "PASS" : "FAIL") + ": Revoke old deposit Minter");

  let minterNew = await core.isMinter(newDeposit.address);
  console.log((minterNew ? "PASS" : "FAIL") + ": Grant new deposit Minter");

  let pcvControllerRatioPCVController = await core.isPCVController(ratioController.address);
  console.log((pcvControllerRatioPCVController ? "PASS" : "FAIL") + ": Grant ratio controller PCVController");

  console.log("\nParameter Updates");
  let bpsFromPeg = await newDeposit.maxBasisPointsFromPegLP();
  let expectedBPsFromPeg = new BN("100");
  let bpsUpdated = bpsFromPeg.eq(expectedBPsFromPeg);
  console.log((bpsUpdated ? "PASS" : "FAIL") + ": Basis points from Peg LP updated");

  let allocations = await bc.getAllocation();
  let allocationToAdapter = allocations[0][0] == adapter.address;
  console.log((allocationToAdapter ? "PASS" : "FAIL") + ": Bonding curve allocates to adapter");

  let allocation100Percent = allocations[1][0].eq(new BN('10000'));
  console.log((allocation100Percent ? "PASS" : "FAIL") + ": Bonding curve allocates 100%");
  
  let target = await adapter.target();
  let adapterToDripper = target == ethPCVDripper.address;
  console.log((adapterToDripper ? "PASS" : "FAIL") + ": Adapter points to dripper");

  console.log("\nBalances");
  let oldDepositBalance = await oldDeposit.totalValue();
  console.log((oldDepositBalance.eq(new BN('0')) ? "PASS" : "FAIL") + ": Withdraws all liquidity from old deposit");

  let newDepositBalance = await newDeposit.totalValue();
  console.log((newDepositBalance.gt(new BN('10000000000000000000000')) ? "PASS" : "FAIL") + ": Deposits all liquidity to new deposit");

  let dripperBalanceBefore = new BN(await web3.eth.getBalance(ethPCVDripper.address));
  await bc.purchase(accounts[0], '10000000000', {value: '10000000000'});
  await bc.allocate();
  let dripperBalanceAfter = new BN(await web3.eth.getBalance(ethPCVDripper.address));
  let allocateToDripper = dripperBalanceAfter.sub(dripperBalanceBefore).eq(new BN('10000000000'));
  console.log((allocateToDripper ? "PASS" : "FAIL") + ": Bonding Curve allocation sends to dripper");

  callback();
}
