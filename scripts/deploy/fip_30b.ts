import { DeployUpgradeFunc } from '../../types/types';
import { ethers } from 'hardhat';

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, feiDAO } = addresses;

  if (!core || !feiDAO) {
    throw new Error('An environment variable contract address is not set');
  }

  const minDelay = 12 * 60 * 60; // 12h min delay
  const delay = 24 * 60 * 60; // 1 day delay

  const signer = await ethers.getSigner(deployAddress);
  const factory = await ethers.getContractFactory('FeiDAOTimelock');
  const feiDAOTimelock = await factory.connect(signer).deploy(core, feiDAO, delay, minDelay);

  logging && console.log('FeiDAOTimelock deployed to: ', feiDAOTimelock.address);

  return {
    feiDAOTimelock
  };
};
