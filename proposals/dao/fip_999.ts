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
import { getImpersonatedSigner } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  if (!addresses.core) {
    console.log(`core: ${addresses.core}`);

    throw new Error('An environment variable contract address is not set');
  }

  // Create a new Balancer deposit for the BAL/WETH pool
  const balancerDepositWeightedPoolFactory = await ethers.getContractFactory('BalancerPCVDepositWeightedPool');
  const balancerDepositBalWeth = await balancerDepositWeightedPoolFactory.deploy(
    addresses.core,
    addresses.balancerVault,
    addresses.balancerRewards,
    '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014', // poolId
    '300', // max 3% slippage
    '0xba100000625a3754423978a60c9317c58a424e3D', // BAL token
    [addresses.balUsdCompositeOracle, addresses.chainlinkEthUsdOracleWrapper]
  );
  await balancerDepositBalWeth.deployTransaction.wait();

  logging && console.log('Balancer BAL/WETH deposit:', balancerDepositBalWeth.address);

  return {
    balancerDepositBalWeth
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  /*const signer = await getImpersonatedSigner(addresses.feiDAOTimelock);
  console.log('Step 1. Withdraw 200 WETH from Aave to the BAL/WETH PCVDeposit');
  await contracts.aaveEthPCVDeposit.connect(signer).withdraw(addresses.balancerDepositBalWeth, '200000000000000000000');
  console.log('Step 2. Move 200k BAL from Timelock to the deposit');
  await contracts.bal.connect(signer).transfer(addresses.balancerDepositBalWeth, '200000000000000000000000');
  console.log('Step 3. Deposit BAL and WETH in the Balancer pool');
  await contracts.balancerDepositBalWeth.connect(signer).deposit();
  console.log('Step 5. Replace BAL Timelock Lens by BAL/WETH deposit in CR Oracle');
  await contracts.collateralizationOracle.connect(signer).swapDeposit(addresses.balDepositWrapper, addresses.balancerDepositBalWeth);*/
  logging && console.log('No setup for FIP-999');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-999');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  // No more BAL on the timelock
  expect(await contracts.bal.balanceOf(contracts.feiDAOTimelock.address)).to.be.equal('0');

  // Expect BAL to be moved to the new deposit.
  // The amount accounts for the ETH deposited in addition to the BAL
  // Should be between [240k, 260k].
  const balBalance = await contracts.balancerDepositBalWeth.balance();
  expect(balBalance).to.be.at.least('240000000000000000000000');
  expect(balBalance).to.be.at.most('260000000000000000000000');

  // CR Oracle updates
  expect(await contracts.collateralizationOracle.depositToToken(contracts.balancerDepositBalWeth.address)).to.be.equal(
    addresses.bal
  );
};
