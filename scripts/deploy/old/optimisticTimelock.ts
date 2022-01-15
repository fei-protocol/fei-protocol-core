import { DeployUpgradeFunc } from '../../../types/types';
import { ethers } from 'hardhat';

const fourDays = 4 * 24 * 60 * 60;

const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { tribalChiefOptimisticMultisig, core } = addresses;

  if (!tribalChiefOptimisticMultisig || !core) {
    throw new Error('An environment variable contract address is not set');
  }

  const optimisticTimelock = await (
    await ethers.getContractFactory('OptimisticTimelock')
  ).deploy(core, fourDays, [tribalChiefOptimisticMultisig], [tribalChiefOptimisticMultisig]);

  logging && console.log('Optimistic Timelock deployed to: ', optimisticTimelock.address);
  return {
    optimisticTimelock
  };
};

module.exports = { deploy };
