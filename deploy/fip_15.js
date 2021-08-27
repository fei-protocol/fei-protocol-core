/* eslint-disable max-len */
const { BN } = require('../test/helpers');

const StakingTokenWrapper = artifacts.require('StakingTokenWrapper');
const TribalChief = artifacts.require('TribalChief');
const ERC20Dripper = artifacts.require('ERC20Dripper');

// number of seconds between allowed drips
// this is 1 week in seconds
const dripFrequency = 604800;

// We will drip 4 million tribe per week
const dripAmount = new BN(4000000).mul(new BN(10).pow(new BN(18)));

async function deploy(deployAddress, addresses, logging = false) {
  const { coreAddress, tribeAddress, rariPool8TribeAddress } = addresses;

  const tribalChief = await TribalChief.new(
    coreAddress,
    tribeAddress,
  );

  const erc20Dripper = await ERC20Dripper.new(
    coreAddress,
    tribalChief.address,
    dripFrequency,
    dripAmount,
    tribeAddress
  );

  const stakingTokenWrapper = await StakingTokenWrapper.new(
    tribalChief.address,
    rariPool8TribeAddress,
  );

  return {
    stakingTokenWrapper,
    erc20Dripper,
    tribalChief
  };
}

module.exports = { deploy };
