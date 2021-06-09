const { BN } = require('@openzeppelin/test-helpers/src/setup');

const ForceEth = artifacts.require('ForceEth');
const Core = artifacts.require('Core');
const Fei = artifacts.require('Fei');

const hre = require('hardhat');

const { web3 } = hre;

async function main() {
  // eslint-disable-next-line global-require
  require('dotenv').config();
  let coreAddress; let feiAddress; let 
    timelockAddress;
  if (process.env.TESTNET_MODE) {
    coreAddress = process.env.RINKEBY_CORE;
    feiAddress = process.env.RINKEBY_FEI;
    timelockAddress = process.env.RINKEBY_TIMELOCK;
  } else {
    coreAddress = process.env.MAINNET_CORE;
    feiAddress = process.env.MAINNET_FEI;
    timelockAddress = process.env.MAINNET_TIMELOCK;
  }

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });

  const accounts = await web3.eth.getAccounts();

  const core = await Core.at(coreAddress);
  const fei = await Fei.at(feiAddress);

  console.log('Deploying ForceEth');
  const forceEth = await ForceEth.new({value: '1000000000000000000000'});

  console.log('Forcing ETH to timelock');
  await forceEth.forceEth(timelockAddress);

  console.log('Granting roles to accounts[0]');
  await core.grantGovernor(accounts[0], {from: timelockAddress});
  await core.grantPCVController(accounts[0], {from: accounts[0]});
  await core.grantMinter(accounts[0], {from: accounts[0]});
  await core.grantBurner(accounts[0], {from: accounts[0]});

  console.log('Minting FEI to accounts[0]');
  if (await fei.paused()) {
    await fei.unpause({from: accounts[0]});
  }
  await fei.mint(accounts[0], new BN('10000000000000000000000000000000000'));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
