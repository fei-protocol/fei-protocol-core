require('dotenv').config();

const { BN } = require('@openzeppelin/test-helpers');

const Fei = artifacts.require('Fei');
const IUniswapV2Pair = artifacts.require('IUniswapV2Pair');
const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');

// Syncs the uniswap FEI-ETH pair to a price relative to oracle price
// targetBPs would be multiplied by the peg and divided by 10000 and
// the pair would sync to that price
async function syncPool(targetBPs, addresses, sendingAddress, logging = false) {
  const { feiAddress, ethUniswapPCVDepositAddress, ethPairAddress } = addresses;
  const fei = await Fei.at(feiAddress);
  const uniswapPcvDeposit = await UniswapPCVDeposit.at(ethUniswapPCVDepositAddress);
  const ethPair = await IUniswapV2Pair.at(ethPairAddress);

  logging ? console.log('Current') : undefined;

  // Gets current reserves
  const reserves = await uniswapPcvDeposit.getReserves();
  const peg = await uniswapPcvDeposit.readOracle();

  const pegBN = new BN(peg.value);
  const currentPrice = reserves[0].div(reserves[1]);

  // figure out target amount of FEI in pair
  const target = pegBN.mul(new BN(targetBPs)).div(new BN('10000'));
  logging ? console.log(`Pegging ${currentPrice} to ${target}. Peg: ${pegBN}`) : undefined;

  logging ? console.log('Sync') : undefined;
  const targetFei = reserves[1].mul(target).div(new BN('1000000000000000000'));
  const currentFei = await fei.balanceOf(ethPair.address);

  // Burn current FEI and mint in the target, then sync the pair
  await fei.burnFrom(ethPair.address, currentFei, { from: sendingAddress });
  await fei.mint(ethPair.address, targetFei, { from: sendingAddress });
  await ethPair.sync();
}

module.exports = {
  syncPool
};
