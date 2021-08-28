/* eslint-disable max-len */
const { BN } = require('../test/helpers');

const TribalChief = artifacts.require('TribalChief');
const ERC20Dripper = artifacts.require('ERC20Dripper');
const OptimisticTimelock = artifacts.require('OptimisticTimelock');

// number of seconds between allowed drips
// this is 1 week in seconds
const dripFrequency = 604800;
const fourDays = 4 * 24 * 60 * 60;

// We will drip 4 million tribe per week
const dripAmount = new BN(4000000).mul(new BN(10).pow(new BN(18)));

async function deploy(deployAddress, addresses, logging = false) {
  const { 
    coreAddress, 
    tribeAddress, 
    tribalChiefOptimisticMultisigAddress 
  } = addresses;

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

  const tribalChiefOptimisticTimelock = await OptimisticTimelock.new(
    coreAddress,
    tribalChiefOptimisticMultisigAddress,
    fourDays,
    fourDays
  );

  return {
    erc20Dripper,
    tribalChief,
    tribalChiefOptimisticTimelock,
  };
}

module.exports = { deploy };
