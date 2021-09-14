/*
 DAO Proposal Steps
    1. Mint 1 million FEI to the optimistic timelock
    2. Withdraw 50 ETH from old reserve stabilizer and send to OA multisig
    3. Withdraw remaining eth in old reserve stabilizer and send to EthLidoPCVDeposit
    4. Call deposit on the EthLidoPCVDeposit contract.
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
async function run(addresses, oldContracts, contracts, logging) {
    const {
        fei,
        tribalChiefOptimisticTimelock,
        tribalChiefOptimisticMultisig,
        ethLidoPCVDeposit,
        oldETHReserveStabilizer
    } = contracts;

    await fei.mint(tribalChiefOptimisticTimelock.address, '100000000000000000000');
    await tribalChiefOptimisticMultisig.withdraw(oldETHReserveStabilizer.address, '5000000000000000000');
    await tribalChiefOptimisticMultisig.withdraw(ethLidoPCVDeposit.address, '5000000000000000000');
    await ethLidoPCVDeposit.deposit();
}

// Tears down any changes made in setup() that need to be cleaned up before doing 
// further post-fip checks
async function teardown(addresses, oldContracts, contracts, logging) {}

// Run any validations required on the fip using mocha or console logging
async function validate(addresses, oldContracts, contracts) {
    const {
        fei,
        tribalChiefOptimisticTimelock,
        tribalChiefOptimisticMultisig,
        ethLidoPCVDeposit,
        oldETHReserveStabilizer
    } = contracts;

    // Optimistic timelock should have 1 million FEI
    const optimisticTimeLockFEIBalance = await fei.balanceOf(tribalChiefOptimisticTimelock.address);
    assert.equal(optimisticTimeLockFEIBalance.toString(), '100000000000000000000');

    // Optimistic multisig should have 50 eth
    const optimisticMultisigETHBalance = web3.eth.getBalance(tribalChiefOptimisticMultisig.address);
    assert.equal(optimisticMultisigETHBalance.toString(), '5000000000000000000');

    // EthLidoPCVDeposit should have NO eth
    const ethLidoPCVDepositETHBalance = web3.eth.getBalance(ethLidoPCVDeposit.address);
    assert.equal(ethLidoPCVDepositETHBalance.toString(), '0');

    // Old eth reserve stablizier should have ~no eth
    const oldETHReserveStabilizerETHBalance = web3.eth.getBalance(oldETHReserveStabilizer.address);
    assert.lessThan(oldETHReserveStabilizerETHBalance.toString(), '100000000000000000');
}

module.exports = {
  setup,
  run,
  teardown,
  validate,
};
