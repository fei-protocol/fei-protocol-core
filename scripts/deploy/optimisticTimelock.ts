import { DeployUpgradeFunc } from '../../test/integration/setup/types';
import { ethers } from 'hardhat';

const fourDays = 4 * 24 * 60 * 60;

const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { tribalChiefOptimisticMultisigAddress, coreAddress } = addresses;

  if (!tribalChiefOptimisticMultisigAddress || !coreAddress) {
    throw new Error('An environment variable contract address is not set');
  }

  const optimisticTimelock = await (
    await ethers.getContractFactory('OptimisticTimelock')
  ).deploy(coreAddress, fourDays, [tribalChiefOptimisticMultisigAddress], [tribalChiefOptimisticMultisigAddress]);

  logging && console.log('Optimistic Timelock deployed to: ', optimisticTimelock.address);
  return {
    optimisticTimelock
  };
};

module.exports = { deploy };
