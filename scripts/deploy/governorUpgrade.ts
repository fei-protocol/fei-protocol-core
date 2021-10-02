import { DeployUpgradeFunc } from '../../types/types';
import { ethers } from 'hardhat';

const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {

  const {
    tribe,
    timelock
  } = addresses;

  if (
    !tribe || !timelock
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const feiDAO = await (
    await ethers.getContractFactory('FeiDAO')
  ).deploy(tribe, timelock);

  logging && console.log('FeiDAO deployed to: ', feiDAO.address);

  return {
    feiDAO
  };
};

module.exports = { deploy };
