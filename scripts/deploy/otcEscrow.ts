import { DeployUpgradeFunc } from '@custom-types/types';
import { ethers } from 'hardhat';

export const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  const { fei, tribe, multisig } = addresses;

  if (!tribe || !fei || !multisig) {
    throw new Error('An environment variable contract address is not set');
  }

  const grayhat = '0x24354D31bC9D90F62FE5f2454709C32049cf866b';

  const factory = await ethers.getContractFactory('OtcEscrow');
  const otcEscrow = await factory.deploy(
    grayhat,
    multisig,
    fei,
    tribe,
    ethers.constants.WeiPerEther.mul(3_750_000), // 3.75M FEI
    ethers.constants.WeiPerEther.mul(400_000) // 400k TRIBE
  );

  logging && console.log('OTC deployed to: ', otcEscrow.address);

  return { otcEscrow };
};
