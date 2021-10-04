import { DeployUpgradeFunc } from '../../types/types';
import { ethers } from 'hardhat';

const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { tribe, timelock, multisig } = addresses;

  if (!tribe || !timelock || !multisig) {
    throw new Error('An environment variable contract address is not set');
  }

  const signer = await ethers.getSigner(deployAddress);
  const factory = await ethers.getContractFactory('GovernorAlpha');
  const governorAlphaBackup = await factory.connect(signer).deploy(timelock, tribe, ethers.constants.AddressZero);

  logging && console.log('Backup Gov Alpha deployed to: ', governorAlphaBackup.address);

  const feiDAOFactory = await ethers.getContractFactory('FeiDAO');
  const feiDAO = await feiDAOFactory.connect(signer).deploy(tribe, timelock, multisig);

  logging && console.log('FeiDAO deployed to: ', feiDAO.address);

  return {
    feiDAO,
    governorAlphaBackup
  };
};

module.exports = { deploy };
