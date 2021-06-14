/*
 DAO Proposal Steps
    1. X
    2. Y
    3. Z
*/

// Setup:
// 1. Any protocol changes expected between current mainnet state and 
//    fip execution on chain
// 2. Any mocks needed to call run() (like impersonateAccount)
async function setup() {}

// Runs the DAO proposal steps listed above
async function run() {}

// Tears down any changes made in setup() that need to be cleaned up before doing 
// further post-fip checks
async function teardown() {}

// Fetches all the state needed to run the validation functions
// @arg fipHasRun bool: used to conditionally get state from the protocol
async function getProtocolState(fipHasRun) {}

// Checks chain state before the fip has run to validate that:
// 1. Chainforked mainnet state is as expected
// 2. The setup() script has run correctly
// @arg protocolStateBeforeFip: value of getProtocolState() before run() and after setup()
async function preFipValidation(protocolStateBeforeFip) {}

// Checks chain state after the fip has run. Includes checks that compare the 
// state before and after the fip
// @arg protocolStateBeforeFip: value of getProtocolState() before run() and after setup()
// @arg protocolStateAfterFip: value of getProtocolState() after run() and teardown()
async function postFipValidation(protocolStateBeforeFip, protocolStateAfterFip) {}

module.exports {
    setup,
    run,
    teardown,
    getProtocolState,
    preFipValidation,
    postFipValidation,
}