import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { IFuseAdmin } from '@custom-types/contracts/IFuseAdmin';

chai.use(CBN(ethers.BigNumber));

const UNDERLYINGS = [
  '0xBaaa1F5DbA42C3389bDbc2c9D2dE134F5cD0Dc89',
  '0x06cb22615BA53E60D67Bf6C341a0fD5E718E1655',
  '0x3D1556e84783672f2a3bd187a592520291442539'
];
const NAMES = ['FeiRari d3pool Fuse', 'FeiRari FEI-3Crv Metampool Fuse', 'FeiRari Gelato FEI-DAI LP Fuse'];
const SYMBOLS = ['fD3-8', 'fFEI-3Crv-8', 'fG-UNI-FEI-DAI-8'];

/*
FIP-60: Add tokens to FeiRari

DEPLOY ACTIONS:

1. Deploy TribalChiefSyncExtension
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  return {} as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');

  const comptroller = await ethers.getContractAt('Unitroller', addresses.rariPool8Comptroller);

  logging && console.log('singing');

  const daoSigner = await getImpersonatedSigner('0x5eA4A9a7592683bF0Bc187d6Da706c6c4770976F');
  const admin = await ethers.getContractAt('IFuseAdmin', '0xa731585ab05fC9f83555cf9Bff8F58ee94e18F85');

  logging && console.log('editing whitelist');
  await admin
    .connect(daoSigner)
    ._editCErc20DelegateWhitelist(
      ['0x67Db14E73C2Dce786B5bbBfa4D010dEab4BBFCF9'],
      ['0x38a024C0b412B9d1db8BC398140D00F5Af3093D4'],
      [false],
      [true]
    );

  logging && console.log('getitng fd3');
  const fD3 = await ethers.getContractAt('CErc20Delegator', await comptroller.cTokensByUnderlying(UNDERLYINGS[0]));

  const signer = await getImpersonatedSigner(admin.address);
  await forceEth(admin.address);

  // TODO move setup to OA script
  logging && console.log('setting impl');

  await fD3
    .connect(signer)
    ._setImplementationSafe(
      '0x38a024C0b412B9d1db8BC398140D00F5Af3093D4',
      false,
      await ethers.utils.defaultAbiCoder.encode(['address'], ['0x5fc748f1FEb28d7b76fa1c6B07D8ba2d5535177c'])
    );

  console.log(await fD3.implementation());

  logging && console.log('done');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {};
