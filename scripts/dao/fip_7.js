const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const hre = require('hardhat');
const CErc20Delegator = artifacts.require('CErc20Delegator');
const Fei = artifacts.require('Fei');

/*
 DAO Proposal Steps
    1. Accept admin transfer from Tetranode
    2. Mint 10M FEI into Timelock
    3. Approve 10M FEI transfer
    4. Mint cTokens by depositing FEI into Rari pool
*/

const tetranodePoolAddress = '0xd8553552f8868C1Ef160eEdf031cF0BCf9686945';
const feiTimelockAddress = '0x639572471f2f318464dc01066a56867130e45E25';
const feiAddress = '0x956F47F50A910163D8BF957Cf5846D573E7f87CA';

async function main() {
    const accounts = await web3.eth.getAccounts();
    const rariPoolEight = await CErc20Delegator.at(tetranodePoolAddress)
    const fei = await Fei.at(feiAddress);    

    // Impersonate the current admin address + add ETH
    const currentPoolAdmin = await rariPoolEight.admin();
    await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [currentPoolAdmin]
    });
    await web3.eth.sendTransaction({from: accounts[0], to: currentPoolAdmin, value: '10000000000000000'});

    // Initiate transfer admin over to our timelock
    await rariPoolEight._setPendingAdmin(feiTimelockAddress, {
        from: currentPoolAdmin
    });

    // Impersonate the Timelock + add ETH
    await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [feiTimelockAddress]
    });
    await web3.eth.sendTransaction({from: accounts[0], to: feiTimelockAddress, value: '10000000000000000'});

    // 1. Accept admin role from our timelock
    await rariPoolEight._acceptAdmin({
        from: feiTimelockAddress,
    });

    // 2. Mint FEI into timelock
    const tenMillion = '10000000000000000000000000';
    await fei.mint(feiTimelockAddress, tenMillion, {
        from: feiTimelockAddress,
    });

    // 3. Approve transfer into rari pool
    await fei.approve(tetranodePoolAddress, tenMillion, {
        from: feiTimelockAddress,
    });

    // 4. Supply FEI to rari pool
    await rariPoolEight.mint(tenMillion, {
        from: feiTimelockAddress,
    });
}

module.exports = { main };