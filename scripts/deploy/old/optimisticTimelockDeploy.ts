import { DeployUpgradeFunc } from '@custom-types/types';
import { ethers } from 'hardhat';

const fourDays = 4 * 24 * 60 * 60;

const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core } = addresses;

  const TIMELOCK_ADMIN_ADDRESS = process.env.TIMELOCK_ADMIN_ADDRESS;

  if (!TIMELOCK_ADMIN_ADDRESS) {
    throw new Error('TIMELOCK_ADMIN_ADDRESS environment variable contract address is not set');
  }

  if (!core) {
    throw new Error('Core contract address is not set');
  }

  const optimisticTimelock = await (
    await ethers.getContractFactory('OptimisticTimelock')
  ).deploy(core, fourDays, [TIMELOCK_ADMIN_ADDRESS], [TIMELOCK_ADMIN_ADDRESS]);

  logging && console.log('Optimistic Timelock deployed to: ', optimisticTimelock.address);

  return { optimisticTimelock };
};

module.exports = { deploy };
