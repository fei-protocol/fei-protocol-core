import { DeployUpgradeFunc } from '../../types/types';
import { ethers } from 'hardhat';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { tribe, timelock, multisig } = addresses;

  if (!tribe || !timelock || !multisig) {
    throw new Error('An environment variable contract address is not set');
  }

  const governorAlpha = await (await ethers.getContractFactory('GovernorAlpha')).deploy(timelock, tribe, ZERO_ADDRESS);

  logging && console.log('Backup Gov Alpha deployed to: ', governorAlpha.address);

  const feiDAO = await (await ethers.getContractFactory('FeiDAO')).deploy(tribe, timelock, multisig);

  logging && console.log('FeiDAO deployed to: ', feiDAO.address);

  return {
    feiDAO,
    governorAlpha
  };
};

module.exports = { deploy };
