/* eslint-disable max-len */
const { web3 } = require('hardhat');
const { BN } = require('../../test/helpers');

const TribalChief = artifacts.readArtifactSync('TribalChief');
const TransparentUpgradeableProxy = artifacts.readArtifactSync('TransparentUpgradeableProxy');
const ProxyAdmin = artifacts.readArtifactSync('ProxyAdmin');
const ERC20Dripper = artifacts.readArtifactSync('ERC20Dripper');
const OptimisticTimelock = artifacts.readArtifactSync('OptimisticTimelock');

// number of seconds between allowed drips
// this is 1 week in seconds
const dripFrequency = 604800;
const fourDays = 4 * 24 * 60 * 60;

// We will drip 4 million tribe per week
const dripAmount = new BN(4000000).mul(new BN(10).pow(new BN(18)));

async function deploy(deployAddress, addresses, logging = false) {
  const { coreAddress, tribeAddress, timelockAddress, tribalChiefOptimisticMultisigAddress } = addresses;

  const tribalChiefImpl = await TribalChief.new(coreAddress);
  logging && console.log('TribalChief impl deployed to: ', tribalChiefImpl.address);

  // Create a new Proxy admin
  const proxyAdmin = await ProxyAdmin.new();

  logging && console.log('ProxyAdmin deployed to: ', proxyAdmin.address);

  // Grant ownership of that admin to the DAO, so the DAO can perform future contract upgrades
  await proxyAdmin.transferOwnership(timelockAddress);

  logging && console.log('Transferred ownership of proxy to the DAO');

  // This initialize calldata gets atomically executed against the impl logic
  // upon construction of the proxy
  const calldata = await web3.eth.abi.encodeFunctionCall(
    {
      name: 'initialize',
      type: 'function',
      inputs: [
        {
          type: 'address',
          name: 'core'
        },
        {
          type: 'address',
          name: 'tribe'
        }
      ]
    },
    [coreAddress, tribeAddress]
  );

  const tribalChief = await TribalChief.at(
    (
      await TransparentUpgradeableProxy.new(tribalChiefImpl.address, proxyAdmin.address, calldata)
    ).address
  );

  logging && console.log('TribalChief deployed to: ', tribalChief.address);

  const erc20Dripper = await ERC20Dripper.new(
    coreAddress,
    tribalChief.address,
    dripFrequency,
    dripAmount,
    tribeAddress
  );

  logging && console.log('ERC20 Dripper deployed to: ', erc20Dripper.address);

  const tribalChiefOptimisticTimelock = await OptimisticTimelock.new(
    coreAddress,
    tribalChiefOptimisticMultisigAddress,
    fourDays,
    fourDays
  );

  logging && console.log('TribalChiefOptimisticTimelock deployed to: ', tribalChiefOptimisticTimelock.address);

  return {
    erc20Dripper,
    tribalChief,
    tribalChiefImpl,
    tribalChiefOptimisticTimelock,
    proxyAdmin
  };
}

module.exports = { deploy };
