const { BN } = require('@openzeppelin/test-helpers/src/setup');

const ForceEth = artifacts.require('ForceEth');
const Core = artifacts.require('Core');
const Fei = artifacts.require('Fei');

const hre = require('hardhat');

const { web3 } = hre;

// Grants Governor, Minter, Burner, and PCVController access to accounts[0]
// Also mints a large amount of FEI to accounts[0]
async function sudo(addresses, logging = false) {
  const { coreAddress, feiAddress, timelockAddress } = addresses;
  // Impersonate the Timelock which has Governor access on-chain
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });

  const accounts = await web3.eth.getAccounts();

  const core = await Core.at(coreAddress);
  const fei = await Fei.at(feiAddress);

  // Force ETH to the Timelock to send txs on its behalf
  logging ? console.log('Deploying ForceEth') : undefined;
  const forceEth = await ForceEth.new({value: '2000000000000000000'});

  logging ? console.log('Forcing ETH to timelock') : undefined;
  await forceEth.forceEth(timelockAddress);

  // Use timelock to grant access
  logging ? console.log('Granting roles to accounts[0]') : undefined;
  await core.grantGovernor(accounts[0], {from: timelockAddress});
  await core.grantPCVController(accounts[0], {from: accounts[0]});
  await core.grantMinter(accounts[0], {from: accounts[0]});
  await core.grantBurner(accounts[0], {from: accounts[0]});

  logging ? console.log('Minting FEI to accounts[0]') : undefined;
  await fei.mint(accounts[0], new BN('10000000000000000000000000000000000'));
}

module.exports = { sudo };
