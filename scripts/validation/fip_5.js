const { BN } = require('@openzeppelin/test-helpers');

const EthUniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');
const EthPCVDripper = artifacts.require('EthPCVDripper');
const EthPCVDepositAdapter = artifacts.require('EthPCVDepositAdapter');
const EthBondingCurve = artifacts.require('EthBondingCurve');
const RatioPCVController = artifacts.require('RatioPCVController');
const Core = artifacts.require('Core');

// A validation script to make sure after the DAO steps are run that the necessary state updates are made
module.exports = async function(callback) {
  // eslint-disable-next-line global-require
  require('dotenv').config();

  const accounts = await web3.eth.getAccounts();

  let oldDepositAddress; 
  let newDepositAddress; 
  let coreAddress; 
  let ratioControllerAddress; 
  let adapterAddress; 
  let bondingCurveAddress; 
  let dripperAddress;
  
  if (process.env.TESTNET_MODE) {
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

  const newDeposit = await EthUniswapPCVDeposit.at(newDepositAddress);
  const oldDeposit = await EthUniswapPCVDeposit.at(oldDepositAddress);
  const ratioController = await RatioPCVController.at(ratioControllerAddress);
  const adapter = await EthPCVDepositAdapter.at(adapterAddress);
  const bc = await EthBondingCurve.at(bondingCurveAddress);
  const ethPCVDripper = await EthPCVDripper.at(dripperAddress);
  const core = await Core.at(coreAddress);

  console.log('Access Control');

  const revokedOld = !(await core.isMinter(oldDeposit.address));
  console.log(`${revokedOld ? 'PASS' : 'FAIL'}: Revoke old deposit Minter`);

  const minterNew = await core.isMinter(newDeposit.address);
  console.log(`${minterNew ? 'PASS' : 'FAIL'}: Grant new deposit Minter`);

  const pcvControllerRatioPCVController = await core.isPCVController(ratioController.address);
  console.log(`${pcvControllerRatioPCVController ? 'PASS' : 'FAIL'}: Grant ratio controller PCVController`);

  console.log('\nParameter Updates');
  const bpsFromPeg = await newDeposit.maxBasisPointsFromPegLP();
  const expectedBPsFromPeg = new BN('100');
  const bpsUpdated = bpsFromPeg.eq(expectedBPsFromPeg);
  console.log(`${bpsUpdated ? 'PASS' : 'FAIL'}: Basis points from Peg LP updated`);

  const allocations = await bc.getAllocation();
  const allocationToAdapter = allocations[0][0] == adapter.address;
  console.log(`${allocationToAdapter ? 'PASS' : 'FAIL'}: Bonding curve allocates to adapter`);

  const allocation100Percent = allocations[1][0].eq(new BN('10000'));
  console.log(`${allocation100Percent ? 'PASS' : 'FAIL'}: Bonding curve allocates 100%`);
  
  const target = await adapter.target();
  const adapterToDripper = target === ethPCVDripper.address;
  console.log(`${adapterToDripper ? 'PASS' : 'FAIL'}: Adapter points to dripper`);

  console.log('\nBalances');
  const oldDepositBalance = await oldDeposit.totalValue();
  console.log(`${oldDepositBalance.eq(new BN('0')) ? 'PASS' : 'FAIL'}: Withdraws all liquidity from old deposit`);

  const newDepositBalance = await newDeposit.totalValue();
  console.log(`${newDepositBalance.gt(new BN('10000000000000000000000')) ? 'PASS' : 'FAIL'}: Deposits all liquidity to new deposit`);

  const dripperBalanceBefore = new BN(await web3.eth.getBalance(ethPCVDripper.address));
  await bc.purchase(accounts[0], '10000000000', {value: '10000000000'});
  await bc.allocate();
  const dripperBalanceAfter = new BN(await web3.eth.getBalance(ethPCVDripper.address));
  const allocateToDripper = dripperBalanceAfter.sub(dripperBalanceBefore).eq(new BN('10000000000'));
  console.log(`${allocateToDripper ? 'PASS' : 'FAIL'}: Bonding Curve allocation sends to dripper`);

  callback();
};
