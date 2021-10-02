import { ethers } from 'hardhat';
import { DeployUpgradeFunc } from '../../types/types';

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { tribalChief, rariRewardsDistributorDelegator } = addresses;
  const stakingTokenWrapperFactory = await ethers.getContractFactory('StakingTokenWrapper');
  const stakingTokenWrapper = await stakingTokenWrapperFactory.deploy(tribalChief, rariRewardsDistributorDelegator);

  logging && console.log('StakingTokenWrapper impl deployed to: ', stakingTokenWrapper.address);

  return {
    stakingTokenWrapper
  };
};
