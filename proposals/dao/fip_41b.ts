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
import { BAMMPlugin, CErc20Delegator, ICErc20Plugin, IFuseAdmin, IPlugin } from '@custom-types/contracts';
import { forceEth } from '@test/integration/setup/utils';

chai.use(CBN(ethers.BigNumber));

/*

// LUSD Fuse Plugin

DEPLOY ACTIONS:

1. Deploy Rari Pool 7 LUSD Deposit
2. Deploy LUSD Swapper
3. Deploy BAMM Plugin

DAO ACTIONS:
1. Create LUSD_SWAP_ADMIN Role
2. Grant LUSD_SWAP_ADMIN to fLUSD
3. Grant LUSD Swapper PCV Controller
*/

const BUFFER = ethers.constants.WeiPerEther.div(50); // 2% buffer
const ETH_MIN_SWAP = ethers.constants.WeiPerEther.div(4); // 0.25 ETH minimum swap

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, bamm, liquityFusePoolLusd, compoundEthPCVDeposit, lusd, rariPool7Lusd } = addresses;

  if (!core) {
    console.log(`core: ${core}`);

    throw new Error('An environment variable contract address is not set');
  }

  // Create LUSD Fuse Pool 7 Deposit
  const depositFactory = await ethers.getContractFactory('ERC20CompoundPCVDeposit');
  const rariPool7LusdPCVDeposit = await depositFactory.deploy(core, rariPool7Lusd, lusd);
  await rariPool7LusdPCVDeposit.deployTransaction.wait();

  logging && console.log('LUSD Pool 7 PCV Deposit deployed to:', rariPool7LusdPCVDeposit.address);

  // Create LUSD swapper factory
  const factory = await ethers.getContractFactory('LUSDSwapper');
  const lusdSwapper = await factory.deploy(core, bamm, rariPool7LusdPCVDeposit.address, compoundEthPCVDeposit);
  await lusdSwapper.deployTransaction.wait();

  logging && console.log('LUSD Swapper deployed to:', lusdSwapper.address);

  const pluginFactory = await ethers.getContractFactory('BAMMPlugin');
  const bammPlugin = await pluginFactory.deploy(liquityFusePoolLusd, bamm, lusdSwapper.address, ETH_MIN_SWAP, BUFFER);
  await bammPlugin.deployTransaction.wait();

  logging && console.log('BAMMPlugin deployed to:', bammPlugin.address);

  return {
    lusdSwapper,
    rariPool7LusdPCVDeposit,
    bammPlugin
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

  const fLUSD: CErc20Delegator = contracts.liquityFusePoolLusd as CErc20Delegator;

  const signer = await getImpersonatedSigner(admin.address);
  await forceEth(admin.address);

  await fLUSD.connect(signer)._setImplementationSafe(
    addresses.liquityFusePoolLusdImpl,
    false,
    await ethers.utils.defaultAbiCoder.encode(
      ['address', 'address'],
      [
        addresses.bammPlugin,
        ethers.constants.AddressZero // TODO add rewards plugin logic
      ]
    )
  );
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-41');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const fLUSD: ICErc20Plugin = contracts.liquityFusePoolLusd as ICErc20Plugin;
  const bammPlugin: BAMMPlugin = contracts.bammPlugin as BAMMPlugin;

  expect(await fLUSD.plugin()).to.be.equal(bammPlugin.address);

  expect(await bammPlugin.BAMM()).to.be.equal(addresses.bamm);
  expect(await bammPlugin.lusdSwapper()).to.be.equal(addresses.lusdSwapper);
  expect(await bammPlugin.lqty()).to.be.equal('0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D');
  expect(await bammPlugin.stabilityPool()).to.be.equal('0x66017D22b0f8556afDd19FC67041899Eb65a21bb');

  expect(await bammPlugin.buffer()).to.be.bignumber.equal(ethers.constants.WeiPerEther.div(50));
  expect(await bammPlugin.ethSwapMin()).to.be.bignumber.equal(ethers.constants.WeiPerEther.div(4));
};
