/*
 DAO Proposal Steps
    1. X
    2. Y
    3. Z
*/

/* Params:
    addresses - all addresses in /contract-addresses/mainnetAddresses.json in an object of depth 1
    oldContracts - an object of Web3 contract instances using the contract state from BEFORE any upgrades
    contracts - an object of Web3 contract instances using the contract state from AFTER any upgrades
        for example if a new UniswapPCVDeposit is deployed, the new instance is in contracts and the old instance is in oldContracts
    logging - a flag for whether to log updates to the console
*/    

// Setup:
// 1. Any protocol changes expected between current mainnet state and 
//    fip execution on chain
//    for example in `indexOTC` the counterparty needed to approve INDEX before the DAO vote could execute
// 2. Any mocks needed to call run() (like impersonateAccount)
async function setup(addresses, oldContracts, contracts, logging) {}

// Runs the DAO proposal steps listed above
// Note that these mock the on-chain proposal, but the actual execution will be handled by the governor
async function run(addresses, oldContracts, contracts, logging) {}

// Tears down any changes made in setup() that need to be cleaned up before doing 
// further post-fip checks
async function teardown(addresses, oldContracts, contracts, logging) {}

// Run any validations required on the fip using mocha or console logging
async function validate(addresses, oldContracts, contracts) {}

module.exports = {
  setup,
  run,
  teardown,
  validate,
};
