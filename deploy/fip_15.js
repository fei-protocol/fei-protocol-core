const StakingTokenWrapper = artifacts.require('StakingTokenWrapper');
const TribalChief = artifacts.require('TribalChief');

async function deploy(deployAddress, addresses, logging = false) {
  const { coreAddress, tribeAddress, rariPool8TribeAddress } = addresses;

  const tribalChief = await TribalChief.new(
    coreAddress,
    tribeAddress,
  );
  const stakingTokenWrapper = await StakingTokenWrapper.new(
    tribalChief.address,
    rariPool8TribeAddress,
  );

  return {
    stakingTokenWrapper,
    tribalChief
  };
}

module.exports = { deploy };
