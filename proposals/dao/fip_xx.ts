import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*

DAO Proposal #9001

Description:

Steps:
  1 - 
  2 -
  3 - 

*/

const fipNumber = '9001'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log('Deploy ERC4626 wrappers on fFEI-8, fLUSD-8, fDAI-8');

  const erc4626CErc20WrapperFactory = await ethers.getContractFactory('ERC4626CErc20Wrapper');

  const erc4626CErc20WrapperFeiRariFei = await erc4626CErc20WrapperFactory.deploy(
    addresses.rariPool8Fei, // fFEI-8 CErc20
    'fFEI-8 ERC4626 Wrapper', // token name
    '4626-fFEI-8' // token symbol
  );
  await erc4626CErc20WrapperFeiRariFei.deployTransaction.wait();
  console.log('fFEI-8 ERC4626 Wrapper:', erc4626CErc20WrapperFeiRariFei.address);

  const erc4626CErc20WrapperFeiRariDai = await erc4626CErc20WrapperFactory.deploy(
    addresses.rariPool8Dai, // fDAI-8 CErc20
    'fDAI-8 ERC4626 Wrapper', // token name
    '4626-fDAI-8' // token symbol
  );
  await erc4626CErc20WrapperFeiRariDai.deployTransaction.wait();
  console.log('fDAI-8 ERC4626 Wrapper:', erc4626CErc20WrapperFeiRariDai.address);

  const erc4626CErc20WrapperFeiRariLusd = await erc4626CErc20WrapperFactory.deploy(
    addresses.rariPool8Lusd, // fLUSD-8 CErc20
    'fLUSD-8 ERC4626 Wrapper', // token name
    '4626-fLUSD-8' // token symbol
  );
  await erc4626CErc20WrapperFeiRariLusd.deployTransaction.wait();
  console.log('fLUSD-8 ERC4626 Wrapper:', erc4626CErc20WrapperFeiRariLusd.address);

  return {
    erc4626CErc20WrapperFeiRariFei,
    erc4626CErc20WrapperFeiRariDai,
    erc4626CErc20WrapperFeiRariLusd
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

export { deploy, setup, teardown, validate };
