

// 1. Unlock the admin from rari pool and transfer admin over to our timelock (see sudo script). Tetranode will do this on mainnet
// 2. Write a script that mimicks the DAO proposal after having unlocked the timelock by executing the proposal steps on the timelock itself.
// 3. Then run a validation script that checks balances are updated (10mil in rari pool, I have ctokens and I'm the admin on the pool)
// 4. Replicate those proposal steps on ropsten/preview tally. This gets the call data from the exact transaction that you'll submit to the DAO. Copy paste that into my computer. Sumbit proposal, click data on metamask and copy the hex
// 5. scripts/dao/exec.js takes in the hex and submits it straight through the DAO
// 6. Run same validation code as before to check everything is updated
// 7. When you submit to the dao you just copy paste the data into metamask, not on tally

// Actual calls that need to be done
// 1. Accept admin role on the rari fuse pool
// 1.X. Change params on rari pool (???)
// 2. Mint the FEI into timelock
// 3. Approve Rari pool to transfer FEI (just the amount) (check function to remove the supply cap - how much you can supply for a single address)
// 4. Trigger the mint function into the rari pool (receive c tokens in return and leave them in the timelock)

const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const hre = require('hardhat');
const CErc20Delegator = artifacts.require('CErc20Delegator');
const Fei = artifacts.require('Fei');

/*
 DAO Proposal Steps
    1. Accept admin transfer from Tetranode
    2. Change params on Rari pool
    3. Mint 10M FEI into Timelock
    4. Approve 10M FEI transfer
    5. Adjust/remove supply cap on Rari pool
    6. Mint cTokens by depositing FEI into Rari pool
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

    // TODO: add step for changing pool params if we are going to do that

    // 3. Mint FEI into timelock
    const tenMillion = '10000000000000000000000000';
    await fei.mint(feiTimelockAddress, tenMillion, {
        from: feiTimelockAddress,
    });

    // 4. Approve transfer into rari pool
    await fei.approve(tetranodePoolAddress, tenMillion, {
        from: feiTimelockAddress,
    });

    // TODO: add step increase supply cap on the pool. Seems like it works fine without that tho

    // Supply FEI to rari pool
    await rariPoolEight.mint(tenMillion, {
        from: feiTimelockAddress,
    });
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});

