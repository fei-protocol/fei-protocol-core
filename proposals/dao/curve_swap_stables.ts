import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { forceEth } from '@test/integration/setup/utils';

/*

Curve swap stables

Description: Acquire Fuse hack related stablecoins by selling DAI on Curve.
*/

const fipNumber = 'Swap DAI for USDC and USDT on Curve';

const minUSDCReceived = ethers.constants.WeiPerEther.mul(10_073_986).div(1e12); // 10.073M USDC, account for 6 decimals
const minUSDTReceived = ethers.constants.WeiPerEther.mul(133_178).div(1e12); // 133.178k USDT, account for 6 decimals

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log(`No deploy actions for fip${fipNumber}`);
  return {
    // put returned contract objects here
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  await forceEth(addresses.tribalCouncilTimelock);
  await forceEth(addresses.tribalCouncilSafe);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const usdc = contracts.usdc;
  const usdt = contracts.usdt;
  const dai = contracts.dai;

  // 1. Validate received USDC
  const receivedUSDC = await usdc.balanceOf(addresses.tribalCouncilTimelock);
  expect(receivedUSDC).to.be.bignumber.at.least(minUSDCReceived);
  console.log('Amount received USDC: ', receivedUSDC.toString());

  // 2. Validate received USDT
  const receivedUSDT = await usdt.balanceOf(addresses.tribalCouncilTimelock);
  expect(receivedUSDT).to.be.bignumber.at.least(minUSDTReceived);
  console.log('Amount received USDT: ', receivedUSDT.toString());
};

export { deploy, setup, teardown, validate };
