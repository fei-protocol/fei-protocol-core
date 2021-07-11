const hre = require('hardhat');

const { constants: { ZERO_ADDRESS } } = require('@openzeppelin/test-helpers');

const EthCompoundPCVDeposit = artifacts.require('EthCompoundPCVDeposit');
const ERC20CompoundPCVDeposit = artifacts.require('ERC20CompoundPCVDeposit');

const { web3 } = hre;
const e18 = '000000000000000000';

async function setup(addresses, oldContractAddresses, logging) {}

// The DAO steps for FIP-9, these must be done with Governor access control privileges
async function run(addresses, oldContractAddresses, logging = false) {
  const accounts = await web3.eth.getAccounts();
  const {
    rariPool8EthPCVDepositAddress,
    rariPool8FeiPCVDepositAddress
  } = addresses;
  const dripper = await EthCompoundPCVDeposit.at(rariPool8EthPCVDepositAddress);
  const steth = await ERC20CompoundPCVDeposit.at(rariPool8FeiPCVDepositAddress);
}

async function teardown(addresses, oldContractAddresses, logging) {}

module.exports = { setup, run, teardown };
