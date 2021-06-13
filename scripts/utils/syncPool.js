require('dotenv').config();

const { BN } = require('@openzeppelin/test-helpers');

const Fei = artifacts.require('Fei');
const IUniswapV2Pair = artifacts.require('IUniswapV2Pair');
const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');

const hre = require('hardhat');

const { web3 } = hre;

const { getAddresses } = require('./helpers');

// Syncs the uniswap FEI-ETH pair to a price relative to oracle price
// targetBPs would be multiplied by the peg and divided by 10000 and the pair would sync to that price
async function syncPool(targetBPs) {
  const { feiAddress, ethUniswapPCVDepositAddress, ethPairAddress } = getAddresses();

  const accounts = await web3.eth.getAccounts();
  const fei = await Fei.at(feiAddress);
  const uniswapPcvDeposit = await UniswapPCVDeposit.at(ethUniswapPCVDepositAddress);
  const ethPair = await IUniswapV2Pair.at(ethPairAddress);

  console.log('Current');

  // Gets current reserves
  const reserves = await uniswapPcvDeposit.getReserves();
  // The on-chain abi is peg() but the new abi will be readOracle() so we have to manually call this one
  const pegCall = await web3.eth.call({from: accounts[0], to: uniswapPcvDeposit.address, data: web3.eth.abi.encodeFunctionSignature('readOracle()')});
  const peg = await web3.eth.abi.decodeParameter({Decimal: {value: 'uint256'}}, pegCall);

  const pegBN = new BN(peg.value);
  const currentPrice = reserves[0].div(reserves[1]);

  // figure out target amount of FEI in pair
  const target = pegBN.mul(new BN(targetBPs)).div(new BN('10000'));
  console.log(`Pegging ${currentPrice} to ${target}. Peg: ${pegBN}`);

  console.log('Sync');
  const targetFei = reserves[1].mul(target).div(new BN('1000000000000000000'));
  const currentFei = await fei.balanceOf(ethPair.address);

  // Burn current FEI and mint in the target, then sync the pair
  await fei.burnFrom(ethPair.address, currentFei, {from: accounts[0]});
  await fei.mint(ethPair.address, targetFei, {from: accounts[0]});
  await ethPair.sync();
}

module.exports = {
  syncPool
};
