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
import { getImpersonatedSigner } from '@test/helpers';

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

  const voltHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.volt, false);
  await voltHoldingDeposit.deployTransaction.wait();
  logging && console.log('VOLT holding deposit deployed to: ', voltHoldingDeposit.address);

  const daiHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.dai, false);
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
  expect(await wethHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.weth);

  expect(await lusdHoldingDeposit.token()).to.be.equal(addresses.lusd);
  expect(await lusdHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.lusd);

  expect(await voltHoldingDeposit.token()).to.be.equal(addresses.volt);
  expect(await voltHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.volt);

  expect(await daiHoldingDeposit.token()).to.be.equal(addresses.dai);
  expect(await daiHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.dai);

  // 2. Validate can drop funds on the PCV Deposits and then withdraw with the guardian
  const wethWhale = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  await forceEth(wethWhale);
  const wethWhaleSigner = await getImpersonatedSigner(wethWhale);

  // Transfer to the empty PCV deposit. Validate that the balance reads correctly, then withdraw
  const transferAmount = ethers.constants.WeiPerEther.mul(100);
  await contracts.weth.connect(wethWhaleSigner).transfer(wethHoldingDeposit.address, transferAmount);

  expect(await wethHoldingDeposit.balance()).to.be.equal(transferAmount);
  expect(await contracts.weth.balanceOf(wethHoldingDeposit.address)).to.be.equal(transferAmount);

  const resistantBalanceAndFei = await wethHoldingDeposit.resistantBalanceAndFei();
  expect(resistantBalanceAndFei[0]).to.be.equal(transferAmount);
  expect(resistantBalanceAndFei[1]).to.be.equal(0);

  // Transfer out
  const receiver = '0xFc312F21E1D56D8dab5475FB5aaEFfB18B892a85';
  const guardianSigner = await getImpersonatedSigner(addresses.feiDAOTimelock);
  await wethHoldingDeposit.connect(guardianSigner).withdrawERC20(addresses.weth, receiver, transferAmount);

  expect(await wethHoldingDeposit.balance()).to.be.equal(0);
  expect(await contracts.weth.balanceOf(receiver)).to.be.equal(transferAmount);
};

export { deploy, setup, teardown, validate };
