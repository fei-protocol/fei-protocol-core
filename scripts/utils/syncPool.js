const { BN } = require("@openzeppelin/test-helpers");

const Fei = artifacts.require("Fei");
const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const UniswapPCVDeposit = artifacts.require("UniswapPCVDeposit");



module.exports = async function(callback) {
  require('dotenv').config();

  var feiAddress, uiAddress, ethPairAddress;
  if(process.env.TESTNET_MODE) {
    feiAddress = process.env.RINKEBY_FEI;
    udAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_DEPOSIT;
    ethPairAddress = process.env.RINKEBY_FEI_ETH_PAIR;
  } else {
    feiAddress = process.env.MAINNET_FEI;
    udAddress = process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT;
    ethPairAddress = process.env.MAINNET_FEI_ETH_PAIR;
  }

  let accounts = await web3.eth.getAccounts();
  let fei = await Fei.at(feiAddress);
  let ui = await UniswapPCVDeposit.at(udAddress);
  let ethPair = await IUniswapV2Pair.at(ethPairAddress);

  console.log('Current');

  let reserves = await ui.getReserves();
  let peg = await ui.peg();
  let pegBN = new BN(peg.value);
  let currentPrice = reserves[0].div(reserves[1]);

  let bpsMul = new BN('9950');
  let target = pegBN.mul(bpsMul).div(new BN('10000'));
  console.log(`Pegging ${currentPrice} to ${target}. Peg: ${pegBN}`);


  console.log('Sync');
  let targetFei = reserves[1].mul(target).div(new BN('1000000000000000000'));
  let currentFei = await fei.balanceOf(ethPair.address);

  await fei.burnFrom(ethPair.address, currentFei, {from: accounts[0]});
  await fei.mint(ethPair.address, targetFei, {from: accounts[0]});
  await ethPair.sync();

  callback();
}