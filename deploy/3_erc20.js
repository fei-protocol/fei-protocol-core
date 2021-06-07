const { BN, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('hardhat');

const UniswapPCVDeposit = artifacts.require("UniswapPCVDeposit");
const UniswapPCVController = artifacts.require("UniswapPCVController");
const BondingCurve = artifacts.require("BondingCurve");
require('dotenv').config();

const {
  MAINNET_CORE,
  MAINNET_FEI_ETH_PAIR,
  MAINNET_WETH,
  MAINNET_UNISWAP_ROUTER,
  MAINNET_UNISWAP_ORACLE
} = process.env;

async function main() {
    if (!MAINNET_CORE || !MAINNET_FEI_ETH_PAIR || !MAINNET_WETH || !MAINNET_UNISWAP_ROUTER || !MAINNET_UNISWAP_ORACLE) {
      throw new Error('An environment variable contract address is not set')
    }

    
    const deployAddress = (await web3.eth.getAccounts())[0]

    const uniswapPCVDeposit = new web3.eth.Contract(UniswapPCVDeposit.abi); // factory contract
    await uniswapPCVDeposit.deploy({
      data: UniswapPCVDeposit.bytecode,
      arguments: [
        MAINNET_CORE,
        MAINNET_FEI_ETH_PAIR,
        MAINNET_UNISWAP_ROUTER, 
        MAINNET_UNISWAP_ORACLE,
        '100'
      ]
    }).send({ from: deployAddress }) // contract bytecode and constructor arguments
    console.log('UniswapPCVDeposit deployed to: ', uniswapPCVDeposit.address)

    const tenPow18 = ether('1');
    const uniswapPCVController = new web3.eth.Contract(UniswapPCVController.abi); // factory contract
    await uniswapPCVController.deploy({
      data: UniswapPCVDeposit.bytecode,
      arguments: [
        MAINNET_CORE,
        uniswapPCVDeposit.address,
        MAINNET_UNISWAP_ORACLE,
        tenPow18.mul(new BN('500')),
        new BN('100'),
        MAINNET_FEI_ETH_PAIR,
        14400
      ]
    }).send({ from: deployAddress })
    console.log('Uniswap PCV controller deployed to: ', uniswapPCVController.address)
    
    const bondingCurve = new web3.eth.Contract(BondingCurve.abi); // factory contract
    await bondingCurve.deploy({
      data: BondingCurve.bytecode,
      arguments: [
        MAINNET_CORE,
        MAINNET_UNISWAP_ORACLE,
        tenPow18.mul(new BN('10000000')),
        [uniswapPCVDeposit.address],
        [10000],
        '100',
        '100',
        MAINNET_WETH,
        tenPow18.mul(new BN('500')),
        '100'
      ]
    }).send({ from: deployAddress })
    console.log('Bonding curve deployed to: ', bondingCurve.address)
}

main()
.then(() => process.exit(0))
.catch(err => {
  console.log(err);
  process.exit(1);
});