import { DeployUpgradeFunc } from '@custom-types/types';
import { ethers } from 'hardhat';

export const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  const { core } = addresses;

  const CTOKEN = process.env.CTOKEN;

  if (!CTOKEN) {
    throw new Error('CTOKEN environment variable contract address is not set');
  }

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  const erc20CompoundPCVDepositFactory = await ethers.getContractFactory('ERC20CompoundPCVDeposit');
  const erc20CompoundPCVDeposit = await erc20CompoundPCVDepositFactory.deploy(core, CTOKEN);

  logging && console.log('ERC20CompoundPCVDeposit deployed to: ', erc20CompoundPCVDeposit.address);

  return { erc20CompoundPCVDeposit };
};
