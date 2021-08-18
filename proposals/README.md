# Making a DAO Proposal
This guide assumes you already have enough TRIBE to make a proposal on-chain.

## Optional Step 1: Does Proposal Require New Code?
If your proposal requires new code additions to succeed, these need to be developed and reviewed. It should first be reviewed by the Fei Core smart contracts team and the team of any relevant integrations before sending to audit.

## Optional Step 2: Does Proposal Require New Contract Deployments?
Whether a deployment of a new instance of a pre-exisiting or new contract, if your proposal requires a new contract deployment you'll need to write a deploy script.

See examples in the `deploy` folder, name your file `fip_x.js`

To execute the deployment run:
* mainnet - `DEPLOY_FILE=fip_x npm run deploy:main`
* testnet - `DEPLOY_FILE=fip_x npm run deploy:rinkeby`
* local - `DEPLOY_FILE=fip_x npm run deploy:localhost`

Development can be done using localhost forks of mainnet that interface with our end-to-end test suite before deploying to mainnet.

## Step 3: Proposal Description

Follow `/proposals/description/fip_x.json`

Make sure this description is up to date and approved by the Fei Core smart contracts team before continuing development.

## Step 4: Proposal Mocking and Integration Test
Write a script following the template of `proposals/dao/fip_x.js` they import the contract addresses and trigger the appropriate governor functions with the intended inputs.

The setup, teardown, and validation hooks are used to compare the output of the dao script to the actual on-chain calldata proposed to the governor.

Add an object with the key `fip_x` to `end-to-end/proposals_config.json`, 

Your proposal will be run before any integration tests via `npm run test:e2e`
* deploy - set to true only if you added a deploy script for your proposal in step 2, otherwise false
* exec - set to false until step 5

### Updating Permissions
If your proposal updates the access control permissions of a contract, you need to list/remove the address key in the appropriate sections of `/contract-addresses/permissions.json`

These are validated in the last e2e test

## Step 5: Testing Exact Proposal Calldat

This script does a full end-to-end DAO proposal, vote, queue, and execution on the exact calldata to be submitted to the DAO.

The goal of this step is to compare the execution results of the calldata to the mock script from step 4. Any setup and teardown calls in the `proposals/dao/fip_x.js` file will still execute, but the run step is replaced by the execution of the DAO code in `proposals/dao/exec.js`.

First compose the calldata, we recommend using the Tally interface + metamask (if you want to build a tool to construct it within the repo using the json descriptions, apply for a grant!).

Make sure to have visibility into the calldata on your browser wallet. In Metamask this is 
in settings -> advanced -> show hex data. Upon Tx submission you will read this data.

To get the calldata, submit a proposal on https://www.withtally.com/governance/fei/proposal/new with the intended proposal commands, title and description. Click "Submit proposal" but **do not** confirm the Metamask transaction. Instead simply copy the calldata into the config entry for `fip_x` in `end-to-end/proposals_config.json` for integration testing:
* proposal_calldata - fill in the copied calldata
* proposer - fill in proposer address
* voter - 0xB8f482539F2d3Ae2C9ea6076894df36D1f632775

Then run `npm run test:e2e`

### Deploying and Updating Addresses
Once your proposal passes the e2e tests for both mock and exact calldata, you should run your deploy script if you had one from step 2. Update `/contract-addresses/mainnet-addresses.json` with the new contract addresses. Then update the fork block inside the hardhat config and set the deploy flag to false in the config entry for `fip_x` in `end-to-end/proposals_config.json`

Finally rerun `npm run test:e2e` and make sure everything passes as expected

## Step 6: Propose on-chain
Send a transaction to the Fei DAO (0xE087F94c3081e1832dC7a22B48c6f2b5fAaE579B) using the calldata previously submitted

Verify on https://www.withtally.com/governance/fei/ that your proposal submitted and everything looks as expected