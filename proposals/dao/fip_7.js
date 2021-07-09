const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const hre = require('hardhat');

const CErc20Delegator = artifacts.require('CErc20Delegator');
const Fei = artifacts.require('Fei');

const { getAddresses } = require('../utils/helpers');

const { 
  timelockAddress,
  rariPoolEightComptrollerAddress,
  rariPoolEightFeiAddress,
  rariPoolEightTribeAddress,
  rariPoolEightEthAddress,
  rariPoolEightDaiAddress,
} = getAddresses();

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
async function setup() {
  const accounts = await web3.eth.getAccounts();
  const rariPoolEightComptroller = await CErc20Delegator.at(rariPoolEightComptrollerAddress);
  const rariPoolEightFei = await CErc20Delegator.at(rariPoolEightFeiAddress);
  const rariPoolEightTribe = await CErc20Delegator.at(rariPoolEightTribeAddress);
  const rariPoolEightEth = await CErc20Delegator.at(rariPoolEightEthAddress);
  const rariPoolEightDai = await CErc20Delegator.at(rariPoolEightDaiAddress);

  // Impersonate the current admin addresses + add ETH
  const currentPoolComptrollerAdmin = await rariPoolEightComptroller.admin();
  const currentPoolFeiAdmin = await rariPoolEightFei.admin();
  const currentPoolTribeAdmin = await rariPoolEightTribe.admin();
  const currentPoolEthAdmin = await rariPoolEightEth.admin();
  const currentPoolDaiAdmin = await rariPoolEightDai.admin();
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
  await web3.eth.sendTransaction({from: accounts[0], to: currentPoolComptrollerAdmin, value: '10000000000000000'});
  await web3.eth.sendTransaction({from: accounts[0], to: currentPoolFeiAdmin, value: '10000000000000000'});
  await web3.eth.sendTransaction({from: accounts[0], to: currentPoolTribeAdmin, value: '10000000000000000'});
  await web3.eth.sendTransaction({from: accounts[0], to: currentPoolEthAdmin, value: '10000000000000000'});
  await web3.eth.sendTransaction({from: accounts[0], to: currentPoolDaiAdmin, value: '10000000000000000'});

  // Initiate transfer of admins over to our timelock
  await rariPoolEightComptroller._setPendingAdmin(timelockAddress, {
    from: currentPoolComptrollerAdmin
  });
  await rariPoolEightFei._setPendingAdmin(timelockAddress, {
    from: currentPoolFeiAdmin
  });
  await rariPoolEightTribe._setPendingAdmin(timelockAddress, {
    from: currentPoolTribeAdmin
  });
  await rariPoolEightEth._setPendingAdmin(timelockAddress, {
    from: currentPoolEthAdmin
  });
  await rariPoolEightDai._setPendingAdmin(timelockAddress, {
    from: currentPoolDaiAdmin
  });

  // Impersonate the Timelock + add ETH
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });
  await web3.eth.sendTransaction({from: accounts[0], to: timelockAddress, value: '10000000000000000'});
}

// The actual steps in the proposal
async function runProposalSteps() {
  const rariPoolEightComptroller = await CErc20Delegator.at(rariPoolEightComptrollerAddress);
  const rariPoolEightFei = await CErc20Delegator.at(rariPoolEightFeiAddress);
  const rariPoolEightTribe = await CErc20Delegator.at(rariPoolEightTribeAddress);
  const rariPoolEightEth = await CErc20Delegator.at(rariPoolEightEthAddress);
  const rariPoolEightDai = await CErc20Delegator.at(rariPoolEightDaiAddress);
  const fei = await Fei.at(process.env.MAINNET_FEI);    

  // 1. Accept admin transfer from Tetranode for Comptroller
  await rariPoolEightComptroller._acceptAdmin({
    from: timelockAddress,
  });
  // 2. Accept admin transfer from Tetranode for FEI
  await rariPoolEightFei._acceptAdmin({
    from: timelockAddress,
  });
  // 3. Accept admin transfer from Tetranode for TRIBE
  await rariPoolEightTribe._acceptAdmin({
    from: timelockAddress,
  });
  // 4. Accept admin transfer from Tetranode for ETH
  await rariPoolEightEth._acceptAdmin({
    from: timelockAddress,
  });
  // 5. Accept admin transfer from Tetranode for DAI
  await rariPoolEightDai._acceptAdmin({
    from: timelockAddress,
  });
  // 6. Mint 10M FEI into Timelock
  const tenMillion = '10000000000000000000000000';
  await fei.mint(timelockAddress, tenMillion, {
    from: timelockAddress,
  });
  // 6. Approve 10M FEI transfer
  await fei.approve(rariPoolEightFei.address, tenMillion, {
    from: timelockAddress,
  });
  // 7. Mint cTokens by depositing FEI into Rari pool
  await rariPoolEightFei.mint(tenMillion, {
    from: timelockAddress,
  });
}

async function main() {
  await setup();
  await runProposalSteps();
}

module.exports = { main };

// Run setup
// setup()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

// Run full script
// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
