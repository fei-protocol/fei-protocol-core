import { DeployUpgradeFunc } from '@custom-types/types';
import { ethers } from 'hardhat';

export const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  const { core } = addresses;

  const DEPOSIT = process.env.DEPOSIT;

  if (!DEPOSIT) {
    throw new Error('DEPOSIT environment variable contract address is not set');
  }

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  const wrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const wrapper = await wrapperFactory.deploy(DEPOSIT);

  logging && console.log('wrapperFactory deployed to: ', wrapper.address);

  return { wrapper };
};
