import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-ethers';
import { assert } from 'chai';
import { web3, ethers } from 'hardhat';

/*
 DAO Proposal Steps
    1. Mint 1 million FEI to the optimistic timelock
    2. Withdraw 50 ETH from old reserve stabilizer and send to OA multisig
    3. Withdraw remaining eth in old reserve stabilizer and send to EthLidoPCVDeposit
    4. Call deposit on the EthLidoPCVDeposit contract.
*/

/* Params:
    addresses - all addresses in /protocol-configuration/mainnetAddresses in an object of depth 1
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
async function setup(addresses, oldContracts, contracts, logging) {
  console.log('Nothing to see here, move along.');
}

// Runs the DAO proposal steps listed above
// Note that these mock the on-chain proposal, but the actual execution will be handled by the governor
async function run(addresses, oldContracts, contracts, logging) {
  const { tribalChiefOptimisticMultisigAddress } = addresses;

  const { fei, tribalChiefOptimisticTimelock, oldEthReserveStabilizer, ethReserveStabilizer } = contracts;

  await fei.mint(tribalChiefOptimisticTimelock.address, ethers.constants.WeiPerEther.mul(1_000_000).toString());
  await oldEthReserveStabilizer.withdraw(
    tribalChiefOptimisticMultisigAddress,
    ethers.constants.WeiPerEther.mul(50).toString()
  );
  await oldEthReserveStabilizer.withdraw(ethReserveStabilizer.address, '3934910050296751636951');
}

// Tears down any changes made in setup() that need to be cleaned up before doing
// further post-fip checks
async function teardown(addresses, oldContracts, contracts, logging) {
  console.log('Nothing to see here, move along.');
}

// Run any validations required on the fip using mocha or console logging
async function validate(addresses, oldContracts, contracts) {
  const { tribalChiefOptimisticMultisigAddress } = addresses;

  const { fei, tribalChiefOptimisticTimelock, oldEthReserveStabilizer } = contracts;

  // Optimistic timelock should have 1 million FEI
  const optimisticTimeLockFEIBalance = await fei.balanceOf(tribalChiefOptimisticTimelock.address);
  assert.equal(optimisticTimeLockFEIBalance.toString(), ethers.constants.WeiPerEther.mul(1_000_000).toString());

  // Optimistic multisig should have 50 eth
  const optimisticMultisigETHBalance = await web3.eth.getBalance('0x35ED000468f397AA943009bD60cc6d2d9a7d32fF');
  assert.equal(optimisticMultisigETHBalance.toString(), ethers.constants.WeiPerEther.mul(50).toString());

  // Old eth reserve stablizier should have zero eth
  const oldETHReserveStabilizerETHBalance = await web3.eth.getBalance(oldEthReserveStabilizer.address);
  assert.equal(
    oldETHReserveStabilizerETHBalance.toString(),
    '0',
    `Old eth stabilizer balance should be zero, got ${oldETHReserveStabilizerETHBalance.toString()}`
  );
}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
