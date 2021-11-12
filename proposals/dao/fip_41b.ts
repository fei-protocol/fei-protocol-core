import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '../../types/types';
import { TransactionResponse } from '@ethersproject/providers';
import { getImpersonatedSigner } from '@test/helpers';
import { ICLusdDelegate, IFuseAdmin } from '@custom-types/contracts';
import { forceEth } from '@test/integration/setup/utils';

chai.use(CBN(ethers.BigNumber));

/*

// LUSD Fuse Plugin

DEPLOY ACTIONS:

1. Deploy LUSD Swapper

DAO ACTIONS:
1. Create LUSD_SWAP_ADMIN Role
2. Grant LUSD_SWAP_ADMIN to fLUSD
3. Grant LUSD Swapper PCV Controller
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, bamm, liquityFusePoolLusdPCVDeposit, compoundEthPCVDeposit } = addresses;

  if (!core) {
    console.log(`core: ${core}`);

    throw new Error('An environment variable contract address is not set');
  }

  // Create LUSD swapper factory
  const factory = await ethers.getContractFactory('LUSDSwapper');
  const lusdSwapper = await factory.deploy(core, bamm, liquityFusePoolLusdPCVDeposit, compoundEthPCVDeposit);
  await lusdSwapper.deployTransaction.wait();

  logging && console.log('LUSD Swapper deployed to:', lusdSwapper.address);

  return {
    lusdSwapper
  } as NamedContracts;
};

// 1. Whitelist Implementation LUSD Fuse Pool
// 2. Set Implementation LUSD Fuse Pool
export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Setup for FIP-41');

  const daoSigner = await getImpersonatedSigner('0x5eA4A9a7592683bF0Bc187d6Da706c6c4770976F');
  const admin: IFuseAdmin = contracts.rariFuseAdmin as IFuseAdmin;

  await admin
    .connect(daoSigner)
    ._editCErc20DelegateWhitelist(
      ['0x67Db14E73C2Dce786B5bbBfa4D010dEab4BBFCF9'],
      [addresses.liquityFusePoolLusdImpl],
      [false],
      [true]
    );

  const fLUSD: ICLusdDelegate = contracts.liquityFusePoolLusd as ICLusdDelegate;

  const signer = await getImpersonatedSigner(admin.address);
  await forceEth(admin.address);

  await fLUSD
    .connect(signer)
    ._setImplementationSafe(
      addresses.liquityFusePoolLusdImpl,
      false,
      await ethers.utils.defaultAbiCoder.encode(['address', 'address'], [addresses.bamm, addresses.lusdSwapper])
    );
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-41');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const fLUSD: ICLusdDelegate = contracts.liquityFusePoolLusd as ICLusdDelegate;

  expect(await fLUSD.BAMM()).to.be.equal(addresses.bamm);
  expect(await fLUSD.lusdSwapper()).to.be.equal(addresses.lusdSwapper);
  expect(await fLUSD.lqty()).to.be.equal('0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D');
  expect(await fLUSD.stabilityPool()).to.be.equal('0x66017D22b0f8556afDd19FC67041899Eb65a21bb');
};
