const { BN } = require('@openzeppelin/test-helpers');

const Fei = artifacts.require('Fei');
const IUniswapV2Pair = artifacts.require('IUniswapV2Pair');
const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');

const hre = require('hardhat');

const { web3 } = hre;

async function syncPool(targetBPs) {
  // eslint-disable-next-line global-require
  require('dotenv').config();

  let feiAddress; 
  let udAddress; 
  let ethPairAddress;
  if (process.env.TESTNET_MODE) {
    feiAddress = process.env.RINKEBY_FEI;
    udAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_DEPOSIT;
    ethPairAddress = process.env.RINKEBY_FEI_ETH_PAIR;
  } else {
    feiAddress = process.env.MAINNET_FEI;
    udAddress = process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT;
    ethPairAddress = process.env.MAINNET_FEI_ETH_PAIR;
  }

  const accounts = await web3.eth.getAccounts();
  const fei = await Fei.at(feiAddress);
  const ui = await UniswapPCVDeposit.at(udAddress);
  const ethPair = await IUniswapV2Pair.at(ethPairAddress);

  console.log('Current');

  const reserves = await ui.getReserves();
  const pegCall = await web3.eth.call({from: accounts[0], to: ui.address, data: web3.eth.abi.encodeFunctionSignature('peg()')});
  const peg = await web3.eth.abi.decodeParameter({Decimal: {value: 'uint256'}}, pegCall);

  const pegBN = new BN(peg.value);
  const currentPrice = reserves[0].div(reserves[1]);

  const target = pegBN.mul(new BN(targetBPs)).div(new BN('10000'));
  console.log(`Pegging ${currentPrice} to ${target}. Peg: ${pegBN}`);

  console.log('Sync');
  const targetFei = reserves[1].mul(target).div(new BN('1000000000000000000'));
  const currentFei = await fei.balanceOf(ethPair.address);

  await fei.burnFrom(ethPair.address, currentFei, {from: accounts[0]});
  await fei.mint(ethPair.address, targetFei, {from: accounts[0]});
  await ethPair.sync();
}

module.exports = {
  syncPool
};
