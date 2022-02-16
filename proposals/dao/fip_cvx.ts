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

chai.use(CBN(ethers.BigNumber));

/*
FIP-60d: Curve and Convex Farming for FeiRari
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  return {} as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const cTokenImpl = addresses.rariPool8CTokenImpl;
  const admin = contracts.fuseFeeDistributor;
  const plugin = addresses.rariPool8ConvexD3Plugin;
  const cErc20PluginImpl = addresses.rariCErc20PluginImpl;

  logging && console.log('Setup');

  const fD3 = contracts.rariPool8FeiD3;

  logging && console.log('singing');

  const daoSigner = await getImpersonatedSigner(addresses.fuseMultisig);

  logging && console.log('editing whitelist');
  await forceEth(addresses.fuseMultisig);
  await admin.connect(daoSigner)._editCErc20DelegateWhitelist([cTokenImpl], [cErc20PluginImpl], [false], [true]);

  const signer = await getImpersonatedSigner(admin.address);
  await forceEth(admin.address);

  logging && console.log('setting impl');

  await admin
    .connect(daoSigner)
    ._callPool(
      [fD3.address],
      '0x50d85b73000000000000000000000000bfb8d550b53f64f581df1da41dda0cb9e596aa0e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000e5af1ac8b9b2c1e1912a051da12c48f25b771b1d'
    );
  // ^ alternative to below
  // await fD3
  //   .connect(signer)
  //   ._setImplementationSafe(cErc20PluginImpl, false, await ethers.utils.defaultAbiCoder.encode(['address'], [plugin]));

  console.log(await fD3.implementation());

  logging && console.log('done');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {};
