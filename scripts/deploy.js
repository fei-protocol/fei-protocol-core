const RatioPCVController = artifacts.require("RatioPCVController");
const UniswapPCVDeposit = artifacts.require("UniswapPCVDeposit");

const IUniswapV2Pair = artifacts.require("IUniswapV2Pair");
const Core = artifacts.require("Core");

async function main() {
    
    require('dotenv').config();
    var coreAddress, pcvDeposit, pairAddress;
    if (process.env.TESTNET_MODE) {
        coreAddress = process.env.RINKEBY_CORE;
        pcvDeposit = process.env.RINKEBY_ETH_UNISWAP_PCV_DEPOSIT;
        pairAddress = process.env.RINKEBY_FEI_ETH_PAIR;
    } else {
        coreAddress = process.env.MAINNET_CORE;
        pcvDeposit = process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT;
        pairAddress = process.env.MAINNET_FEI_ETH_PAIR;
    }

    const router = process.env.MAINNET_UNISWAP_ROUTER;
    const oldControllerAddress = process.env.MAINNET_RATIO_PCV_CONTROLLER;
    const oracle = process.env.MAINNET_UNISWAP_ORACLE;

    let accounts = await web3.eth.getAccounts();

    let controller = await RatioPCVController.new(coreAddress);
    let oldController = await RatioPCVController.at(oldControllerAddress);

    let core = await Core.at(coreAddress);
    console.log("Granting PCVController");
    await core.grantPCVController(controller.address, {from: accounts[0]});

    let newDeposit = await UniswapPCVDeposit.at('0x1fa02b2d6a771842690194cf62d91bdd92bfe28d');
    let pair = await IUniswapV2Pair.at(pairAddress);
    console.log(`Core balance: ${await pair.balanceOf(newDeposit.address)}, PCV Deposit balance: ${await pair.balanceOf(pcvDeposit)}`);

    await core.grantMinter(newDeposit.address, {from: accounts[0]});

    await newDeposit.deposit();
    console.log(`Core balance: ${await pair.balanceOf(newDeposit.address)}, PCV Deposit balance: ${await pair.balanceOf(pcvDeposit)}`);

    console.log("Withdrawing 50%");
    await controller.withdrawRatioERC20(newDeposit.address, pairAddress, coreAddress, 5000, {from: accounts[0]});


    console.log(`Core balance: ${await pair.balanceOf(coreAddress)}, PCV Deposit balance: ${await pair.balanceOf(pcvDeposit)}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });