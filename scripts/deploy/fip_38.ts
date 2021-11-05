import { ethers } from 'hardhat';
import { DeployUpgradeFunc, NamedContracts } from '@custom-types/types';

const toBN = ethers.BigNumber.from;

const TOKEMAK_REWARDS_ADDRESS = '0x79dD22579112d8a5F7347c5ED7E609e60da713C5';
const TOKEMAK_WETH_POOL_ADDRESS = '0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36';
const TOKEMAK_TOKE_POOL_ADDRESS = '0xa760e26aA76747020171fCF8BdA108dFdE8Eb930';

/*

FIP-38 upgrade

This FIP will :
- Seed the OA multisig with 6M TRIBE, to be OTC'd for TOKE with Tokemak DAO
- Have the OA multisig deposit the TOKE ERC20s in Tokemak
- Move 5k ETH from Aave and 5k ETH from Compound to an Eth deposit on Tokemak

*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core } = addresses;

  if (!core) {
    console.log(`core: ${core}`);

    throw new Error('An environment variable contract address is not set');
  }

  // ----------- Deploy Contracts ---------------

  logging && console.log(`1/2 Deploying ETH Tokemak deposit...`);
  const ethTokemakPCVDepositFactory = await ethers.getContractFactory('EthTokemakPCVDeposit');
  const ethTokemakPCVDeposit = await ethTokemakPCVDepositFactory.deploy(
    core,
    TOKEMAK_WETH_POOL_ADDRESS,
    TOKEMAK_REWARDS_ADDRESS
  );
  logging && console.log('  EthTokemakPCVDeposit deployed to:', ethTokemakPCVDeposit.address);

  logging && console.log(`2/2 Deploying TOKE Tokemak deposit...`);
  const tokeTokemakPCVDepositFactory = await ethers.getContractFactory('ERC20TokemakPCVDeposit');
  const tokeTokemakPCVDeposit = await tokeTokemakPCVDepositFactory.deploy(
    core,
    TOKEMAK_TOKE_POOL_ADDRESS,
    TOKEMAK_REWARDS_ADDRESS
  );
  logging && console.log('  ERC20TokemakPCVDeposit deployed to:', tokeTokemakPCVDeposit.address);

  return {
    ethTokemakPCVDeposit,
    tokeTokemakPCVDeposit
  } as NamedContracts;
};
