const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const IDO = artifacts.require("IDO");

module.exports = async function(callback) {
    let accounts = await web3.eth.getAccounts();
    let co = await CoreOrchestrator.deployed();
    let ido = await IDO.at(await co.ido());


    // Get FEI-TRIBE LP tokens on accounts[1]
    await ido.setPendingBeneficiary(accounts[1]);
    await ido.acceptBeneficiary({from: accounts[1]});
    await ido.release({from: accounts[1]});

    callback();

}