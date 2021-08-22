/* eslint-disable max-len */
/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
const { web3 } = require('hardhat');
const hre = require('hardhat');

const {
  coreAddress,
  rariPool8TribeAddress,
  tribeAddress,
} = require('../contract-addresses/mainnetAddresses.json');

const StakingTokenWrapper = artifacts.require('StakingTokenWrapper');
const TribalChief = artifacts.require('TribalChief');

async function deploy(deployAddress, addresses, logging = false) {
  const tribalChief = await TribalChief.new(
    coreAddress.address, tribeAddress.address
  );
  const stakingTokenWrapper = await StakingTokenWrapper.new(
    tribalChief.address,
    rariPool8TribeAddress.address,
  );

  return {
    stakingTokenWrapper,
    tribalChief
  };
}

module.exports = { deploy };
