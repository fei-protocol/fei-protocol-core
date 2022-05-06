import { ethers } from 'hardhat';
import { DeployUpgradeFunc } from '@custom-types/types';

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const TOKEN_DEPOSIT = process.env.TOKEN_DEPOSIT;
  const TOKEN = process.env.TOKEN;
  const IS_PROTOCOL_FEI_DEPOSIT =
    process.env.IS_PROTOCOL_FEI_DEPOSIT && process.env.IS_PROTOCOL_FEI_DEPOSIT.toLowerCase() == 'true' ? true : false;

  if (!TOKEN_DEPOSIT || !TOKEN) {
    throw new Error('TOKEN or TOKEN_DEPOSIT environment variable is not set');
  }

  const erc20PCVDepositWrapperFactory = await ethers.getContractFactory('ERC20PCVDepositWrapper');
  const erc20PCVDepositWrapper = await erc20PCVDepositWrapperFactory.deploy(
    TOKEN_DEPOSIT,
    TOKEN,
    IS_PROTOCOL_FEI_DEPOSIT
  );

  logging && console.log('ERC20PCVDepositWrapper impl deployed to: ', erc20PCVDepositWrapper.address);

  return {
    erc20PCVDepositWrapper
  };
};
