import hre, { ethers, artifacts } from 'hardhat';
import * as dotenv from 'dotenv';
import { NamedAddresses } from '../../test/integration/setup/types';

dotenv.config();

const toBN = ethers.BigNumber.from;

// Syncs the uniswap FEI-ETH pair to a price relative to oracle price
// targetBPs would be multiplied by the peg and divided by 10000 and
// the pair would sync to that price
export async function syncPool(targetBPs: number, addresses: NamedAddresses, sendingAddress: string, logging = false) {
  const feiAddress = addresses.feiAddress;
  const ethUniswapPCVDepositAddress = addresses.ethUniswapPCVDepositAddress;
  const ethPairAddress = addresses.ethPairAddress;
  const fei = await ethers.getContractAt('Fei', feiAddress);
  const uniswapPcvDeposit = await ethers.getContractAt('UniswapPCVDeposit', ethUniswapPCVDepositAddress);
  const ethPair = await ethers.getContractAt('IUniswapV2Pair', ethPairAddress);

  logging ? console.log('Current') : undefined;

  // Gets current reserves
  const reserves = await uniswapPcvDeposit.getReserves();
  const peg = await uniswapPcvDeposit.readOracle();

  const pegBN = toBN(peg.value);
  const currentPrice = reserves[0].div(reserves[1]);

  // figure out target amount of FEI in pair
  const target = pegBN.mul(toBN(targetBPs)).div(toBN('10000'));
  logging ? console.log(`Pegging ${currentPrice} to ${target}. Peg: ${pegBN}`) : undefined;

  logging ? console.log('Sync') : undefined;
  const targetFei = reserves[1].mul(target).div(toBN('1000000000000000000'));
  const currentFei = await fei.balanceOf(ethPair.address);

  // Burn current FEI and mint in the target, then sync the pair
  await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: [sendingAddress] });
  const sendingAddressSigner = await ethers.getSigner(sendingAddress);
  await fei.connect(sendingAddressSigner).burnFrom(ethPair.address, currentFei);
  await fei.connect(sendingAddressSigner).mint(ethPair.address, targetFei);
  await ethPair.sync();
}
