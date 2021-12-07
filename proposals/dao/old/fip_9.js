const hre = require('hardhat');

const {
  constants: { ZERO_ADDRESS }
} = require('@openzeppelin/test-helpers');

const ERC20 = artifacts.require('ERC20');

const { web3 } = hre;
const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

// The DAO steps for FIP-9, these must be done with Governor access control privileges
async function run(addresses, oldContracts, contracts, logging = false) {
  const accounts = await web3.eth.getAccounts();
  const { stethAddress, feiEthPairAddress } = addresses;
  const { ethLidoPCVDeposit, ethPCVDripper, fei } = contracts;

  const steth = await ERC20.at(stethAddress);

  logging ? console.log('Initial state') : undefined;
  logging
    ? console.log(' > Dripper ETH balance :', (await web3.eth.getBalance(ethPCVDripper.address)) / 1e18)
    : undefined;
  logging
    ? console.log(' > EthLidoPCVDeposit ETH balance :', (await web3.eth.getBalance(ethLidoPCVDeposit.address)) / 1e18)
    : undefined;
  logging
    ? console.log(' > EthLidoPCVDeposit stETH balance :', (await steth.balanceOf(ethLidoPCVDeposit.address)) / 1e18)
    : undefined;

  logging ? console.log('Move 10,000 ETH from EthPCVDripper to EthLidoPCVDeposit') : undefined;
  await ethPCVDripper.withdrawETH(ethLidoPCVDeposit.address, `10000${e18}`, { from: accounts[0] });
  logging
    ? console.log(' > Dripper ETH balance :', (await web3.eth.getBalance(ethPCVDripper.address)) / 1e18)
    : undefined;
  logging
    ? console.log(' > EthLidoPCVDeposit ETH balance :', (await web3.eth.getBalance(ethLidoPCVDeposit.address)) / 1e18)
    : undefined;

  logging ? console.log("Deposit EthPCVDripper's ETH to stETH") : undefined;
  await ethLidoPCVDeposit.deposit();
  logging
    ? console.log(' > EthLidoPCVDeposit ETH balance :', (await web3.eth.getBalance(ethLidoPCVDeposit.address)) / 1e18)
    : undefined;
  logging
    ? console.log(' > EthLidoPCVDeposit stETH balance :', (await steth.balanceOf(ethLidoPCVDeposit.address)) / 1e18)
    : undefined;

  logging ? console.log('[FIP-4] Remove FEI incentives') : undefined;
  logging
    ? console.log(' > fei.incentiveContract(ethPairAddress) before :', await fei.incentiveContract(feiEthPairAddress))
    : undefined;
  await fei.setIncentiveContract(feiEthPairAddress, ZERO_ADDRESS, { from: accounts[0] });
  logging
    ? console.log(' > fei.incentiveContract(ethPairAddress) after :', await fei.incentiveContract(feiEthPairAddress))
    : undefined;
}

async function teardown(addresses, oldContracts, contracts, logging) {}

module.exports = { setup, run, teardown };
