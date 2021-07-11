# DAO Scripts
These scripts are used to mimic DAO behavior on locally forked mainnet. They are used to replicate the intended state of the chain post a successful DAO vote. These scripts should validate that the proposal steps complete and the contracts work as expected afterwards.

There are two approaches to mimic the proposal and subsequent state: directly executing the indended DAO proposal calldata, and manually running all proposal steps.

Use the hardhat local network via `npx hardhat node`

Before running any DAO scripts run `npx hardhat run scripts/utils/sudo.js --network localhost` to grant Governor access to the default account[0]

## Exec.js
This script does a full end-to-end DAO proposal, vote, queue, and execution on the exact calldata to be submitted to the DAO.

First make sure to have visibility into the calldata on your wallet. In Metamask this is 
in settings -> advanced -> show hex data. Upon Tx submission you will read this data.

To get the calldata, submit a proposal on https://www.withtally.com/governance/fei/proposal/new with the intended proposal commands, title and description. Click "Submit proposal" but **do not** confirm the Metamask transaction. Instead simply copy the calldata into the global `data` parameter in the script.

Then run `npx hardhat run scripts/dao/exec.js --network localhost`

## Manual FIP script 
These follow the pattern of "fip_3.js", they import the contract addresses and trigger the appropriate governor functions with the intended inputs.

Then run `npx hardhat run scripts/dao/fip_X.js --network localhost`