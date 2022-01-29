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

const cErc20PluginImpl = '0xb9bEECD1A582768711dE1EE7B0A1d582D9d72a6C';
const plugin = '0x2a810409872afc346f9b5b26571fd6ec42ea4849';

/*
FIP-60d: Curve and Convex Farming for FeiRari
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  return {} as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const cTokenImpl = addresses.rariPool8CTokenImpl;
  const admin = contracts.fuseFeeDistributor;

  logging && console.log('Setup');

  const fD3 = contracts.rariPool8FeiD3;

  logging && console.log('singing');

  const daoSigner = await getImpersonatedSigner(addresses.fuseMultisig);

  logging && console.log('editing whitelist');
  await admin.connect(daoSigner)._editCErc20DelegateWhitelist([cTokenImpl], [cErc20PluginImpl], [false], [true]);

  const signer = await getImpersonatedSigner(admin.address);
  await forceEth(admin.address);

  // TODO move setup to OA script
  logging && console.log('setting impl');

  await fD3
    .connect(signer)
    ._setImplementationSafe(cErc20PluginImpl, false, await ethers.utils.defaultAbiCoder.encode(['address'], [plugin]));

  console.log(await fD3.implementation());

  logging && console.log('done');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {};
