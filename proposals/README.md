# Making a DAO Proposal
This guide assumes you already have enough TRIBE to make a proposal on-chain.

## Updating Addresses and Permissions
Update `/contract-addresses/mainnet-addresses.json` and `/contract-addresses/permissions.json`

## Add a description
Follow `/proposals/description/fip_x.json`

## deploy script
This script deploys your contracts to mainnet or a local fork. Add one to `/deploy` named `fip_x.js` if your proposal needs new contracts deployed

## Add to config for Integration Testing
If you add an object with the key `fip_x` to `proposals/config.json`, your proposal will be run before any integration tests via `npm run test:e2e`. 

* deploy - set to true only if you added a deploy script for your proposal
* exec - set to true if you have followed Exec.js below and filled in the proposer, voter, and calladata

## DAO Scripts
These scripts are used to mimic DAO behavior on locally forked mainnet. They are used to replicate the intended state of the chain post a successful DAO vote. 

There are two approaches to mimic the proposal and subsequent state: directly executing the indended DAO proposal calldata, and manually running all proposal steps.

### Exec.js
This script does a full end-to-end DAO proposal, vote, queue, and execution on the exact calldata to be submitted to the DAO.

First make sure to have visibility into the calldata on your wallet. In Metamask this is 
in settings -> advanced -> show hex data. Upon Tx submission you will read this data.

To get the calldata, submit a proposal on https://www.withtally.com/governance/fei/proposal/new with the intended proposal commands, title and description. Click "Submit proposal" but **do not** confirm the Metamask transaction. Instead simply copy the calldata into the config mentioned above for integration testing.

Then run `npm run test:e2e`

### Manual FIP script 
These follow the template of `proposals/dao/fip_x.js`, they import the contract addresses and trigger the appropriate governor functions with the intended inputs.

Then run `npm run test:e2e`