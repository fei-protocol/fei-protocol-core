import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

export function check(flag, message) {
  if (flag) {
    console.log(`PASS: ${message}`);
  } else {
    throw Error(`FAIL: ${message}`);
  }
}

// The current version of the contracts in the repo uses readOracle as the api
// The old api was peg(), so the currently deployed contracts need manual calling until the upgrade
export async function readOracle(oracleRef, web3) {
  const data = await ethers.provider.call({
    to: oracleRef.address,
    data: web3.eth.abi.encodeFunctionSignature('peg()')
  });
  return web3.eth.abi.decodeParameter({ Decimal: { value: 'uint256' } }, data)[0];
}
