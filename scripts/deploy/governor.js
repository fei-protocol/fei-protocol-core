const { web3 } = require('hardhat');

const Timelock = artifacts.readArtifactSync('Timelock');
const GovernorAlpha = artifacts.readArtifactSync('GovernorAlpha');

async function deploy(deployAddress, addresses, logging = false) {
  const { tribeAddress } = addresses;

  if (!tribeAddress) {
    throw new Error('An environment variable contract address is not set');
  }

  const timelock = await Timelock.new(deployAddress, 0);
  logging ? console.log('Timelock deployed to: ', timelock.address) : undefined;

  const governorAlpha = await GovernorAlpha.new(timelock.address, tribeAddress, deployAddress);

  logging ? console.log('GovernorAlpha deployed to: ', governorAlpha.address) : undefined;

  const block = await web3.eth.getBlock('pending');

  const encoded = await web3.eth.abi.encodeParameter('address', governorAlpha.address);
  await timelock.queueTransaction(timelock.address, 0, 'setPendingAdmin(address)', encoded, block.timestamp, {
    from: deployAddress
  });
  await timelock.executeTransaction(timelock.address, 0, 'setPendingAdmin(address)', encoded, block.timestamp, {
    from: deployAddress
  });

  await governorAlpha.__acceptAdmin();

  return {
    timelock,
    governorAlpha
  };
}

module.exports = { deploy };
