const { BN } = require('../test/helpers');

const StakingTokenWrapper = artifacts.require('StakingTokenWrapper');
const TribalChief = artifacts.require('TribalChief');
const ERC20Dripper = artifacts.require('ERC20Dripper');
// number of seconds between allowed drips
const dripFrequency = 604800;
// assume 35 weeks per year so that we always overfund TribalChief by 50%
const dripAmount = new BN(Math.floor(((3.154e+7 / 13) * 75) / 35)).mul(new BN(10).pow(new BN(18)));
console.log(`dripAmount: ${dripAmount.toString()}`);

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
