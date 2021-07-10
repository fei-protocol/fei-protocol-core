const hre = require('hardhat');

const { constants: { ZERO_ADDRESS } } = require('@openzeppelin/test-helpers');

const IPCVSwapper = artifacts.require('IPCVSwapper');
const EthLidoPCVDeposit = artifacts.require('EthLidoPCVDeposit');
const ERC20 = artifacts.require('ERC20');
const Fei = artifacts.require('Fei');

const { web3 } = hre;
const e18 = '000000000000000000';

async function setup(addresses, oldContractAddresses, logging) {}

// The DAO steps for FIP-9, these must be done with Governor access control privileges
async function run(addresses, oldContractAddresses, logging = false) {
  const accounts = await web3.eth.getAccounts();
  const {
    feiAddress,
    feiEthPairAddress
  } = addresses;
  // The old EthPCVDripper contract does not exist anymore, but the
  // IPCVSwapper interface also has a withdrawETH(to, amount) function
  const dripper = await IPCVSwapper.at('0xDa079A280FC3e33Eb11A78708B369D5Ca2da54fE');
  const steth = await ERC20.at('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84');
  const deposit = await EthLidoPCVDeposit.at('0xac38ee05c0204a1e119c625d0a560d6731478880');
  const fei = await Fei.at(feiAddress);

  logging ? console.log('Initial state') : undefined;
  logging ? console.log(' > Dripper ETH balance :', (await web3.eth.getBalance(dripper.address)) / 1e18) : undefined;
  logging ? console.log(' > EthLidoPCVDeposit ETH balance :', (await web3.eth.getBalance(deposit.address)) / 1e18) : undefined;
  logging ? console.log(' > EthLidoPCVDeposit stETH balance :', (await steth.balanceOf(deposit.address)) / 1e18) : undefined;

  logging ? console.log('Move 10,000 ETH from EthPCVDripper to EthLidoPCVDeposit') : undefined;
  await dripper.withdrawETH(deposit.address, `10000${e18}`, {from: accounts[0]});
  logging ? console.log(' > Dripper ETH balance :', (await web3.eth.getBalance(dripper.address)) / 1e18) : undefined;
  logging ? console.log(' > EthLidoPCVDeposit ETH balance :', (await web3.eth.getBalance(deposit.address)) / 1e18) : undefined;

  logging ? console.log('Deposit EthPCVDripper\'s ETH to stETH') : undefined;
  await deposit.deposit();
  logging ? console.log(' > EthLidoPCVDeposit ETH balance :', (await web3.eth.getBalance(deposit.address)) / 1e18) : undefined;
  logging ? console.log(' > EthLidoPCVDeposit stETH balance :', (await steth.balanceOf(deposit.address)) / 1e18) : undefined;

  logging ? console.log('[FIP-4] Remove FEI incentives') : undefined;
  logging ? console.log(' > fei.incentiveContract(ethPairAddress) before :', await fei.incentiveContract(feiEthPairAddress)) : undefined;
  await fei.setIncentiveContract(feiEthPairAddress, ZERO_ADDRESS, {from: accounts[0]});
  logging ? console.log(' > fei.incentiveContract(ethPairAddress) after :', await fei.incentiveContract(feiEthPairAddress)) : undefined;
}

async function teardown(addresses, oldContractAddresses, logging) {}

module.exports = { setup, run, teardown };
