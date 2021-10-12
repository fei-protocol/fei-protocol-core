import { DeployUpgradeFunc } from '../../types/types';
import { ethers } from 'hardhat';

const fourDays = 4 * 24 * 60 * 60;

const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { tribalChiefOptimisticMultisig, core } = addresses;

  const adminAddress = process.env.ADMIN_ADDRESS;

  if (!adminAddress) {
    throw new Error('ADMIN_ADDRESS environment variable contract address is not set');
  }

  if (!tribalChiefOptimisticMultisig || !core) {
    throw new Error('An environment variable contract address is not set');
  }

  const optimisticTimelock = await (
    await ethers.getContractFactory('OptimisticTimelock')
  ).deploy(core, fourDays, [adminAddress], [adminAddress]);

  logging && console.log('Optimistic Timelock deployed to: ', optimisticTimelock.address);

  return { optimisticTimelock };
};

module.exports = { deploy };
