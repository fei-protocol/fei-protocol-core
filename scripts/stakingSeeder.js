const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const FeiRewardsDistributor = artifacts.require("FeiRewardsDistributor");
const IDO = artifacts.require("IDO");

module.exports = async function(callback) {
    let accounts = await web3.eth.getAccounts();
    let co = await CoreOrchestrator.deployed();
    let ido = await IDO.at(await co.ido());
    let distributor = await FeiRewardsDistributor.at(await co.feiRewardsDistributor());



    // Get FEI-TRIBE LP tokens on accounts[1]
    await ido.setPendingBeneficiary(accounts[1], {from: accounts[1]});
    await ido.acceptBeneficiary({from: accounts[1]});
    await ido.release(accounts[1], 1, {from: accounts[1]});
    let availableForRelease = await ido.availableForRelease();
    await ido.release(accounts[1], availableForRelease, {from: accounts[1]});
    await distributor.drip();

    callback();

}