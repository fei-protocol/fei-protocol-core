const hre = require('hardhat');
const { forceEth } = require('../../test/helpers');

const ERC20 = artifacts.require('ERC20');

const e18 = '000000000000000000';

/*
 DAO Proposal Steps
    1. Mint 51M FEI for the Curve deposit
    2. Move 50M DAI from Compound to the Curve deposit
    3. Deposit FEI and DAI in the Curve metapool
*/

// Setup:
// 1. Any protocol changes expected between current mainnet state and
//    fip execution on chain
//    for example in `indexOTC` the counterparty needed to approve INDEX before the DAO vote could execute
// 2. Any mocks needed to call run() (like impersonateAccount)
async function setup(addresses, oldContracts, contracts, logging) {
  // Fill the Compound deposit with 50M DAI
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [addresses.compoundDaiAddress]
  });
  await forceEth(addresses.compoundDaiAddress);
  await contracts.dai.transfer(addresses.compoundDaiPCVDepositAddress, `50000000${e18}`, {
    from: addresses.compoundDaiAddress
  });
  await contracts.compoundDaiPCVDeposit.deposit();
}

// Runs the DAO proposal steps listed above
// Note that these mock the on-chain proposal, but the actual execution will be handled by the governor
async function run(addresses, oldContracts, contracts, logging) {
  await contracts.fei.mint(contracts.curveMetapoolDeposit.address, `51000000${e18}`);
  await contracts.compoundDaiPCVDeposit.withdraw(contracts.curveMetapoolDeposit.address, `50000000${e18}`);
  await contracts.curveMetapoolDeposit.deposit();
}

// Tears down any changes made in setup() that need to be cleaned up before doing
// further post-fip checks
async function teardown(addresses, oldContracts, contracts, logging) {}

// Run any validations required on the fip using mocha or console logging
async function validate(addresses, oldContracts, contracts) {
  const _3crv = await ERC20.at(addresses.curve3crvAddress);
  const _metapool = await ERC20.at(addresses.curveMetapoolAddress);
  console.log('metapool 3crv balance', (await _3crv.balanceOf('0x06cb22615ba53e60d67bf6c341a0fd5e718e1655')) / 1e18);
  console.log(
    'metapool FEI balance',
    (await contracts.fei.balanceOf('0x06cb22615ba53e60d67bf6c341a0fd5e718e1655')) / 1e18
  );
  console.log(
    'Compound PCVDeposit DAI balance',
    (await contracts.dai.balanceOf(addresses.compoundDaiPCVDepositAddress)) / 1e18
  );
  console.log(
    'Curve PCVDeposit Metapool LP tokens balance',
    (await _metapool.balanceOf(contracts.curveMetapoolDeposit.address)) / 1e18
  );
  console.log(
    'Curve PCVDeposit FEI balance',
    (await contracts.fei.balanceOf(contracts.curveMetapoolDeposit.address)) / 1e18
  );
  console.log('Curve PCVDeposit balance()', (await contracts.curveMetapoolDeposit.balance()) / 1e18);
}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
