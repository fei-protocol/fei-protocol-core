# Making and testing an FIP DAO Proposal
Fei Improvement Proposals (FIPs) are the primary mechanism to update Fei Protocol functionality on-chain. 

The proposal flow is automated and integrated into the end-to-end test suite off of live mainnet fork data. This ensures the effect of proposals can be thoroughly tested during development and pre/post execution.

This guide assumes you already have enough TRIBE to make a proposal on-chain.

## Step 1: Proposal Description
Follow `/proposals/description/fip_x.json` for the proposal title and commands.
Add the proposal description text as `/proposals/description/fip_x.txt`

These files will be used to programatically generate the proposal calldata for submission. If some of the addresses are not yet deployed, leave a placeholder such as "TO-ADD: New Bonding Curve" until they have been deployed

Make sure these files are up to date and approved by the Fei Core smart contracts team before continuing development.

## Step 2 (Optional): Updating Permissions
If your proposal updates the access control permissions of a contract, you need to list/remove the address key in the appropriate sections of `/protocol-configuration/permissions.json`

The key names are the same as the ones in `/protocol-configuration/mainnetAddresses.ts`

These permissiones are validated against on-chain state in the last e2e test

## Step 3: Proposal Mocking and Integration Test
Write a script following the template of `proposals/dao/fip_x.js`. See below for descriptions of each of the `deploy`, `setup`,`teardown`, and `validate` functions. Only `validate` is required.

Add an object with the key `fip_x` to `end-to-end/proposals_config.ts`, 

Your proposal will be run before any integration tests via `npm run test:e2e`. Fill in the following parameters:
* deploy - set to true only if you added a deploy script for your proposal in the optional step, otherwise false. This will run your deploy script before the integration tests and add the contract objects as keys in `contracts` parameter of each of the hooks.
* exec - When true, the e2e tests will run the actual proposal through the dao instead of the `run` hook which mocks the behavior. It imports the proposal steps from the `proposals/description/fip_x.json` file

### Step 3a (Optional): deploy() - Contract Deployments:
Whether a deployment of a new instance of a pre-exisiting or new contract, if your proposal requires a new contract deployment you'll need to write a deploy script.

The deploy script is automatically run before any e2e tests if the deploy flag is set to true in the `end-to-end/proposals_config.ts`. The contract objects will be present in the setup, run, teardown and validate hooks as keys in the `contracts` parameter.

This is useful for fully testing the deploy script against a mainnet fork before deploying to mainnet.

If your proposal requires new code additions to succeed, these need to be developed and reviewed. It should first be reviewed by the Fei Core smart contracts team and the team of any relevant integrations before sending to audit.

### Step 3b (Optional): setup() - Pre-DAO steps
The setup hook should contain operational actions from third parties including any address impersonation that occur BEFORE the DAO proposal executes. See `test/helpers.ts#getImpersonatedSigner` and `test/helpers.ts#forceETH`.

The script should use the injected `addresses`, `contracts`, and `oldContracts` parameters to trigger the appropriate governor functions with the intended inputs.

* `addresses` contains a flat mapping of address names to addresses found in `protocol-configuration/mainnetAddresses`
* `contracts` contains a flat mapping of contract names to contract objects using the specified artifact and contract from `protocol-configuration/mainnetAddresses` AFTER all of the deploy and upgrade steps have taken place

* `oldContracts` contains a flat mapping of contract names to contract objects using the specified artifact and contract from `protocol-configuration/mainnetAddresses` from BEFORE all of the deploy and upgrade steps have taken place, in case actions need to be taken on the prior versions of upgraded contracts

### Step 3c (Optional): teardown() - Post-DAO steps
The teardown hook should contain operational actions from third parties including any address impersonation that occur AFTER the DAO proposal executes. 

Uses the same `addresses`, `contracts`, and `oldContracts` parameters as `setup()`.

### Step 3d: validate() - Post-DAO invariant checks
The validate hook should contain any invariant checks that all parameters, roles, and funds are as expected post-DAO and teardown.

Use the mocha testing assertions such as `expect()` to make sure errors fail loudly.

## Optional Step 4: Deploying and Updating Addresses
If your contract has an optional deployment step from above, you need to deploy your new contracts to mainnet before moving on to Step 5.

Run `DEPLOY_FILE=fip_x npm run deploy:fip`

Run your deploy script if you had one from step 2. Update `/protocol-configuration/mainnetAddresses.ts` with the new contract addresses. 

Update the fork block inside the hardhat config and set the deploy flag to false in the config entry for `fip_x` in `end-to-end/proposals_config.ts`

Finally rerun `npm run test:e2e` and make sure everything passes as expected.

## Step 5: Propose on-chain
Construct the calldata by running `DEPLOY_FILE=fip_x npm run calldata`

Send a transaction to the Fei DAO [0x0BEF27FEB58e857046d630B2c03dFb7bae567494](https://etherscan.io/address/0x0bef27feb58e857046d630b2c03dfb7bae567494) using the calldata

Verify on https://www.withtally.com/governance/fei/ that your proposal submitted and everything looks as expected