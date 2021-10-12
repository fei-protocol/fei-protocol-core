import { ethers } from 'hardhat';
import { DeployUpgradeFunc } from '../../types/types';

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { tribalChief } = addresses;

  const BENEFICIARY = process.env.BENEFICIARY;

  if (!BENEFICIARY) {
    throw new Error('BENEFICIARY environment variable contract address is not set');
  }

  if (!tribalChief) {
    throw new Error('TribalChief environment variable contract address is not set');
  }

  const stakingTokenWrapperFactory = await ethers.getContractFactory('StakingTokenWrapper');
  const stakingTokenWrapper = await stakingTokenWrapperFactory.deploy(tribalChief, BENEFICIARY);

  logging && console.log('StakingTokenWrapper impl deployed to: ', stakingTokenWrapper.address);

  return {
    stakingTokenWrapper
  };
};
