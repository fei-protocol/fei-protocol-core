import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

Deploy empty PCV deposits

Purpose is:
1. Safe harbour to which to move funds
2. Not have the funds invested. `deposit()` should be a noop

Assets for which a holding PCV deposit should be deployed are:

*/

const fipNumber = 'empty_pcv_deposits';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy empty PCV deposits for ERC20 assets
  const ERC20HoldingPCVDepositFactory = await ethers.getContractFactory('ERC20HoldingPCVDeposit');
  const wethHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.weth, false);
  await wethHoldingDeposit.deployTransaction.wait();
  logging && console.log('WETH holding deposit deployed to: ', wethHoldingDeposit.address);

  const lusdHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.lusd, false);
  await lusdHoldingDeposit.deployTransaction.wait();
  logging && console.log('LUSD holding deposit deployed to: ', lusdHoldingDeposit.address);

  const voltHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.lusd, false);
  await voltHoldingDeposit.deployTransaction.wait();
  logging && console.log('VOLT holding deposit deployed to: ', voltHoldingDeposit.address);

  const daiHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.lusd, false);
  await daiHoldingDeposit.deployTransaction.wait();
  logging && console.log('DAI holding deposit deployed to: ', daiHoldingDeposit.address);

  return {
    wethHoldingDeposit,
    lusdHoldingDeposit,
    voltHoldingDeposit,
    daiHoldingDeposit
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
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const wethHoldingDeposit = contracts.wethHoldingDeposit;
  const lusdHoldingDeposit = contracts.lusdHoldingDeposit;
  const voltHoldingDeposit = contracts.voltHoldingDeposit;
  const daiHoldingDeposit = contracts.daiHoldingDeposit;

  // 1. Validate all holding PCV Deposits configured correctly
  expect(await wethHoldingDeposit.token()).to.be.equal(addresses.weth);
  expect(await lusdHoldingDeposit.token()).to.be.equal(addresses.lusd);
  expect(await voltHoldingDeposit.token()).to.be.equal(addresses.volt);
  expect(await daiHoldingDeposit.token()).to.be.equal(addresses.dai);

  // 2. Validate can drop funds on the PCV Deposits and then withdraw with the guardian
};

export { deploy, setup, teardown, validate };
