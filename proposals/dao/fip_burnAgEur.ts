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

const fipNumber = '73';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const agEurBurnerFactory = await ethers.getContractFactory('AgEurBurner');
  const agEurBurner = await agEurBurnerFactory.deploy(
    addresses.core,
    addresses.chainlinkEurUsdOracle,
    '100', // maximum 0.5% slippage in addition to Angle's 0.5% burn fee
    '0x5adDc89785D75C86aB939E9e15bfBBb7Fc086A87', // angle stablemaster
    '0x53b981389Cfc5dCDA2DC2e903147B5DD0E985F44' // angle poolmanager
  );
  await agEurBurner.deployed();
  logging && console.log('agEUR burner deployed to:', agEurBurner.address);
  return {
    agEurBurner
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(
    'SETUP agEurAngleUniswapPCVDeposit balance()',
    (await contracts.agEurAngleUniswapPCVDeposit.balance()) / 1e18
  );
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(
    'BEFORE agEurAngleUniswapPCVDeposit balance()',
    (await contracts.agEurAngleUniswapPCVDeposit.balance()) / 1e18
  );
  console.log(
    'BEFORE agEUR balance on agEurBurner',
    (await contracts.agEUR.balanceOf(contracts.agEurBurner.address)) / 1e18
  );
  console.log('burning 1M agEUR...');
  await contracts.agEurBurner.burn('1000000000000000000000000');
  console.log('burning done.');
  console.log(
    'AFTER agEUR balance on agEurBurner',
    (await contracts.agEUR.balanceOf(contracts.agEurBurner.address)) / 1e18
  );
  console.log(
    'AFTER FEI balance on agEurBurner',
    (await contracts.fei.balanceOf(contracts.agEurBurner.address)) / 1e18
  );
};

export { deploy, setup, teardown, validate };
