import { web3 } from 'hardhat'
const { toBN } = web3.utils;

export async function getPeg(controller) {
  const reserves = await controller.getReserves();
  const peg = await controller.readOracle();
  return toBN(peg.value).div(toBN('1000000000000000000'));
}

export async function getPrice(controller) {
  const reserves = await controller.getReserves();
  return reserves[0].div(reserves[1])
}