/* eslint-disable max-len */
const { BN } = require('../test/helpers');

const StakingTokenWrapper = artifacts.require('StakingTokenWrapper');
const TribalChief = artifacts.require('TribalChief');
const ERC20Dripper = artifacts.require('ERC20Dripper');

// number of seconds between allowed drips
// this is 1 week in seconds
const dripFrequency = 604800;

// this number takes the total seconds per year, divides by 13 to get the total 
// number of ethereum blocks per year, then multiplies the amount of blocks by 75 as each block we distribute 75 tribe,
// then divides the total amount of tribe distributed annually by 35, so that by calling it once every week,
// we are always overfunded.
// Then we that quotient and multiply it by 10^18 so that it has the appropriate amount of decimals on it to be the amount of tribe to drip
const dripAmount = new BN(Math.floor(((3.154e+7 / 13) * 75) / 35)).mul(new BN(10).pow(new BN(18)));

async function deploy(deployAddress, addresses, logging = false) {
  const { coreAddress, tribeAddress, rariPool8TribeAddress } = addresses;
  const tribalChief = await TribalChief.new(
    coreAddress, tribeAddress
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
