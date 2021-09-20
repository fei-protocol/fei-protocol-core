import { web3, artifacts } from 'hardhat'
const { toBN } = web3.utils;
const ForceEth = artifacts.require('ForceEth');

export async function getPeg(controller) {
  const peg = await controller.readOracle();
  return toBN(peg.value).div(toBN('1000000000000000000'));
}

export async function getPrice(controller) {
  const reserves = await controller.getReserves();
  return reserves[0].div(reserves[1])
}

export async function forceEth(target) {
  const forceEth = await ForceEth.new({value: '1000000000000000000'});
  await forceEth.forceEth(target);
}
