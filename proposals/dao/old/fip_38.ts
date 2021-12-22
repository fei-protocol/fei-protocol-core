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
import { expectApprox } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));

// Constants
const TOKEMAK_REWARDS_ADDRESS = '0x79dD22579112d8a5F7347c5ED7E609e60da713C5';
const TOKEMAK_WETH_POOL_ADDRESS = '0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36';
const TOKEMAK_TOKE_POOL_ADDRESS = '0xa760e26aA76747020171fCF8BdA108dFdE8Eb930';

/*

TRIBE Buybacks

DEPLOY ACTIONS:

1. Deploy ETH Tokemak PCVDeposit
2. Deploy TOKE Tokemak PCVDeposit

DAO ACTIONS:
1. Allocate 6M TRIBE to the OA Multisig
2. Move 5k ETH from Compound to Tokemak
3. Move 5K ETH from Aave to Tokemak
4. Create the TOKEMAK_DEPOSIT_ADMIN_ROLE role
5. Assign the TOKEMAK_DEPOSIT_ADMIN_ROLE role as Admin role for Tokemak ETH PCVDeposit
6. Assign the TOKEMAK_DEPOSIT_ADMIN_ROLE role as Admin role for Tokemak TOKE PCVDeposit
7. Grant the TOKEMAK_DEPOSIT_ADMIN_ROLE role to OA Multisig

After DAO execution, the OA Multisig will perform an OTC swap with the Tokemak DAO,
To trade the 6M TRIBE for an equivalent amount of TOKE tokens. The OA Multisig
will then deposit the protocol's TOKE tokens in the TOKE PCVDeposit.

These deployments will earn additional TOKE tokens as rewards for providing liquidity.
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

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup for FIP-38');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-38');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const {
    ethTokemakPCVDeposit,
    tokeTokemakPCVDeposit,
    tribe,
    tToke, // Tokemak TOKE reactor
    tWETH // Tokemak ETH reactor
  } = contracts;

  const { optimisticTimelock } = addresses;

  // TRIBE seeding for OTC
  expect((await tribe.balanceOf(optimisticTimelock)).toString()).to.be.equal(ethers.utils.parseEther('6000000'));

  // Deposit ETH in Tokemak
  expect((await ethers.provider.getBalance(ethTokemakPCVDeposit.address)).toString()).to.be.equal(
    ethers.utils.parseEther('0')
  );
  expect((await tWETH.balanceOf(ethTokemakPCVDeposit.address)).toString()).to.be.equal(
    ethers.utils.parseEther('10000')
  );
  expect((await tToke.balanceOf(tokeTokemakPCVDeposit.address)).toString()).to.be.equal(ethers.utils.parseEther('0'));

  // Role creation & assignment
  const tokemakDepositAdminRole = ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE');
  expect(await ethTokemakPCVDeposit.CONTRACT_ADMIN_ROLE()).to.be.equal(tokemakDepositAdminRole);
  expect(await tokeTokemakPCVDeposit.CONTRACT_ADMIN_ROLE()).to.be.equal(tokemakDepositAdminRole);
  expect(await ethTokemakPCVDeposit.isContractAdmin(optimisticTimelock)).to.be.true;
  expect(await tokeTokemakPCVDeposit.isContractAdmin(optimisticTimelock)).to.be.true;
};
