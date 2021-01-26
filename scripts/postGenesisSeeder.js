const GenesisGroup = artifacts.require("GenesisGroup");
const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const UniswapOracle = artifacts.require("UniswapOracle");
const UniswapIncentive = artifacts.require("UniswapIncentive");
const BondingCurveOracle = artifacts.require("BondingCurveOracle");


module.exports = async function(callback) {
    let co = await CoreOrchestrator.deployed();
    const genesis = await GenesisGroup.at(await co.genesisGroup());
    let uniswapOracle = await UniswapOracle.at(await co.uniswapOracle());
    let uniswapIncentive = await UniswapIncentive.at(await co.uniswapIncentive());
    let bondingCurveOracle = await BondingCurveOracle.at(await co.bondingCurveOracle());

    console.log({
        uniswapOracle: uniswapOracle.address,
        genesis: genesis.address,
        uniswapIncentive: uniswapIncentive.address,
        bondingCurveOracle: bondingCurveOracle.address,
    });

    await uniswapOracle.update();
    let price = await uniswapOracle.read();
    console.log(`Uniswap Oracle: price ${price[0] / 1e18}`);

    let accounts = await web3.eth.getAccounts();

    // let launch = await genesis.launch({from: accounts[0]});

    console.log("Launch called on Genesis Group");

    //

    // let nullAddress = "0x0000000000000000000000000000000000000000";
    // let seven = "7000000000000000000";
    // let five = "5000000000000000000";
    // let one = "1000000000000000000";
    // let half = "500000000000000000";


    callback();

}
