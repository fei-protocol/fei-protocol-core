import { ethers } from 'hardhat';
import { DeployUpgradeFunc } from '@custom-types/types';

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { tribalChief } = addresses;

  const STAKED_TOKEN_BENEFICIARY = process.env.STAKED_TOKEN_BENEFICIARY;

  if (!STAKED_TOKEN_BENEFICIARY) {
    throw new Error('STAKED_TOKEN_BENEFICIARY environment variable contract address is not set');
  }

  if (!tribalChief) {
    throw new Error('TribalChief contract address is not set');
  }

  const stakingTokenWrapperFactory = await ethers.getContractFactory('StakingTokenWrapper');
  const stakingTokenWrapper = await stakingTokenWrapperFactory.deploy(tribalChief, STAKED_TOKEN_BENEFICIARY);

  logging && console.log('StakingTokenWrapper impl deployed to: ', stakingTokenWrapper.address);

  return {
    stakingTokenWrapper
  };
};
