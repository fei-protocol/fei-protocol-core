/* eslint-disable max-len */

import { ethers } from 'hardhat';

async function deploy(deployAddress, addresses, logging = false) {

  const rariBeneficiary = '0x73F16f0c0Cd1A078A54894974C5C054D8dC1A3d7';

  const { tribalChief } = addresses;
  const stakingTokenWrapperFactory = await ethers.getContractFactory('StakingTokenWrapper');
  console.log("tribalChief", tribalChief)
  const stakingTokenWrapper = await stakingTokenWrapperFactory.deploy(tribalChief, rariBeneficiary);

  logging && console.log('StakingTokenWrapper impl deployed to: ', stakingTokenWrapper.address);

  return {
    stakingTokenWrapper,
  };
}

module.exports = { deploy };
