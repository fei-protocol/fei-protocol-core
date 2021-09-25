const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const hre = require('hardhat');

const CErc20Delegator = artifacts.require('CErc20Delegator');

/*
 DAO Proposal Steps
    1. Accept admin transfer from Tetranode for Comptroller
    2. Accept admin transfer from Tetranode for FEI
    3. Accept admin transfer from Tetranode for TRIBE
    4. Accept admin transfer from Tetranode for ETH
    5. Accept admin transfer from Tetranode for DAI
    6. Mint 10M FEI into Timelock
    7. Approve 10M FEI transfer
    8. Mint cTokens by depositing FEI into Rari pool
*/

// The steps that don't form part of the proposal but need to be mocked up
async function setup(addresses, oldContracts, contracts, logging) {
  const {
    timelockAddress,
    rariPool8ComptrollerAddress,
    rariPool8FeiAddress,
    rariPool8TribeAddress,
    rariPool8EthAddress,
    rariPool8DaiAddress
  } = addresses;

  const accounts = await web3.eth.getAccounts();
  const rariPool8Comptroller = await CErc20Delegator.at(rariPool8ComptrollerAddress);
  const rariPool8Fei = await CErc20Delegator.at(rariPool8FeiAddress);
  const rariPool8Tribe = await CErc20Delegator.at(rariPool8TribeAddress);
  const rariPool8Eth = await CErc20Delegator.at(rariPool8EthAddress);
  const rariPool8Dai = await CErc20Delegator.at(rariPool8DaiAddress);

  // Impersonate the current admin addresses + add ETH
  const currentPoolComptrollerAdmin = await rariPool8Comptroller.admin();
  const currentPoolFeiAdmin = await rariPool8Fei.admin();
  const currentPoolTribeAdmin = await rariPool8Tribe.admin();
  const currentPoolEthAdmin = await rariPool8Eth.admin();
  const currentPoolDaiAdmin = await rariPool8Dai.admin();
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [currentPoolComptrollerAdmin]
  });
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [currentPoolFeiAdmin]
  });
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [currentPoolTribeAdmin]
  });
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [currentPoolEthAdmin]
  });
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [currentPoolDaiAdmin]
  });
  await web3.eth.sendTransaction({ from: accounts[0], to: currentPoolComptrollerAdmin, value: '10000000000000000' });
  await web3.eth.sendTransaction({ from: accounts[0], to: currentPoolFeiAdmin, value: '10000000000000000' });
  await web3.eth.sendTransaction({ from: accounts[0], to: currentPoolTribeAdmin, value: '10000000000000000' });
  await web3.eth.sendTransaction({ from: accounts[0], to: currentPoolEthAdmin, value: '10000000000000000' });
  await web3.eth.sendTransaction({ from: accounts[0], to: currentPoolDaiAdmin, value: '10000000000000000' });

  // Initiate transfer of admins over to our timelock
  await rariPool8Comptroller._setPendingAdmin(timelockAddress, {
    from: currentPoolComptrollerAdmin
  });
  await rariPool8Fei._setPendingAdmin(timelockAddress, {
    from: currentPoolFeiAdmin
  });
  await rariPool8Tribe._setPendingAdmin(timelockAddress, {
    from: currentPoolTribeAdmin
  });
  await rariPool8Eth._setPendingAdmin(timelockAddress, {
    from: currentPoolEthAdmin
  });
  await rariPool8Dai._setPendingAdmin(timelockAddress, {
    from: currentPoolDaiAdmin
  });

  // Impersonate the Timelock + add ETH
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });
  await web3.eth.sendTransaction({ from: accounts[0], to: timelockAddress, value: '10000000000000000' });
}

// The actual steps in the proposal
async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    timelockAddress,
    rariPool8ComptrollerAddress,
    rariPool8FeiAddress,
    rariPool8TribeAddress,
    rariPool8EthAddress,
    rariPool8DaiAddress
  } = addresses;

  const rariPool8Comptroller = await CErc20Delegator.at(rariPool8ComptrollerAddress);
  const rariPool8Fei = await CErc20Delegator.at(rariPool8FeiAddress);
  const rariPool8Tribe = await CErc20Delegator.at(rariPool8TribeAddress);
  const rariPool8Eth = await CErc20Delegator.at(rariPool8EthAddress);
  const rariPool8Dai = await CErc20Delegator.at(rariPool8DaiAddress);
  const { fei } = contracts;

  // 1. Accept admin transfer from Tetranode for Comptroller
  await rariPool8Comptroller._acceptAdmin({
    from: timelockAddress
  });
  // 2. Accept admin transfer from Tetranode for FEI
  await rariPool8Fei._acceptAdmin({
    from: timelockAddress
  });
  // 3. Accept admin transfer from Tetranode for TRIBE
  await rariPool8Tribe._acceptAdmin({
    from: timelockAddress
  });
  // 4. Accept admin transfer from Tetranode for ETH
  await rariPool8Eth._acceptAdmin({
    from: timelockAddress
  });
  // 5. Accept admin transfer from Tetranode for DAI
  await rariPool8Dai._acceptAdmin({
    from: timelockAddress
  });
  // 6. Mint 10M FEI into Timelock
  const tenMillion = '10000000000000000000000000';
  await fei.mint(timelockAddress, tenMillion, {
    from: timelockAddress
  });
  // 6. Approve 10M FEI transfer
  await fei.approve(rariPool8Fei.address, tenMillion, {
    from: timelockAddress
  });
  // 7. Mint cTokens by depositing FEI into Rari pool
  await rariPool8Fei.mint(tenMillion, {
    from: timelockAddress
  });
}

async function teardown(addresses, oldContracts, contracts) {}

module.exports = { setup, run, teardown };
