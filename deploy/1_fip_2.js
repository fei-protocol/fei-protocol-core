const EthReserveStabilizer = artifacts.require("EthReserveStabilizer");
const EthPCVDripper = artifacts.require("EthPCVDripper");
const { web3 } = require('hardhat');
require('dotenv').config();
    
const { 
  MAINNET_CORE,
  MAINNET_UNISWAP_ORACLE
} = process.env

async function main() {

  if (!MAINNET_CORE) {
    throw new Error('Failed to fetch core Set MAINNET_CORE')
  }

  if (!MAINNET_UNISWAP_ORACLE) {
    throw new Error('Failed to fetch core Set MAINNET_UNISWAP_ORACLE')
  }

  const ethReserveStabiliser = new web3.eth.Contract(EthReserveStabilizer.abi); // factory contract
  await ethReserveStabiliser.deploy({data: EthReserveStabilizer.bytecode, arguments: [core, oracle, "9500"]}) // contract bytecode and constructor args

  const ethPCVDripper = new web3.eth.Contract(EthPCVDripper.abi); // factory contract
  await ethPCVDripper.deploy({data: EthPCVDripper.bytecode, arguments: [core, instance.address, "3600", "5000000000000000000000"]}) // 5000 ETH per hour
}

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
