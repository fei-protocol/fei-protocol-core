import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

DAO Proposal FIP-999

Description:

Steps:
  1 -
  2 -
  3 -

*/

const fipNumber = '999';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  if (!addresses.core) {
    console.log(`core: ${addresses.core}`);

    throw 'An environment variable contract address is not set';
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
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
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

export { deploy, setup, teardown, validate };
