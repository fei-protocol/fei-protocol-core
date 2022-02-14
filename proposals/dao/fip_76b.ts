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

DAO Proposal 76b

The OA Multisig has been used to add LUSD on FeiRari. This DAO proposal executes the 2nd half of FIP-76:
- Seed 5M DAI in FeiRari
- Seed 5M LUSD in FeiRari

Also includes some technical maintenance tasks :
- Finish FEI/ETH migration to Balancer
- Seed 400 ETH on Uniswap FEI/ETH pool to keep ~2M$ of liquidity on Uniswap (required for Compound)
- Remove remaining DPI on Sushiswap & send to DAO Timelock
- Remove unused PCVDeposits from CR oracle

*/

const fipNumber = '76b';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const erc20CompoundPCVDepositFactory = await ethers.getContractFactory('ERC20CompoundPCVDeposit');

  const rariPool8DaiPCVDeposit = await erc20CompoundPCVDepositFactory.deploy(addresses.core, addresses.rariPool8Dai);
  await rariPool8DaiPCVDeposit.deployTransaction.wait();
  logging && console.log('rariPool8DaiPCVDeposit:', rariPool8DaiPCVDeposit.address);

  const rariPool8Comptroller = await ethers.getContractAt('Unitroller', addresses.rariPool8Comptroller);
  const rariPool8LusdAddress = await rariPool8Comptroller.cTokensByUnderlying(addresses.lusd);
  const rariPool8Lusd = await ethers.getContractAt('CErc20Delegator', rariPool8LusdAddress);

  const rariPool8LusdPCVDeposit = await erc20CompoundPCVDepositFactory.deploy(addresses.core, rariPool8Lusd.address);
  await rariPool8LusdPCVDeposit.deployTransaction.wait();
  logging && console.log('rariPool8LusdPCVDeposit:', rariPool8LusdPCVDeposit.address);

  return {
    rariPool8Lusd,
    rariPool8LusdPCVDeposit,
    rariPool8DaiPCVDeposit
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
  // Should have properly seeded FeiRari pool with DAI and LUSD
  expect(await contracts.rariPool8LusdPCVDeposit.balance()).to.be.at.least(ethers.constants.WeiPerEther.mul(4_999_999));
  expect(await contracts.rariPool8DaiPCVDeposit.balance()).to.be.at.least(ethers.constants.WeiPerEther.mul(4_999_999));
  // Migration to Balancer is over
  expect(
    await contracts.core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), contracts.delayedPCVMoverWethUniToBal.address)
  ).to.be.false;
  expect(await contracts.balancerDepositFeiWeth.balance()).to.be.at.least(ethers.constants.WeiPerEther.mul(14000));
  // Uniswap has some liquidity
  expect(await contracts.uniswapPCVDeposit.balance()).to.be.at.least(ethers.constants.WeiPerEther.mul(390));
  // DPI has moved
  expect(await contracts.dpiUniswapPCVDeposit.balance()).to.be.equal(0);
  expect(await contracts.dpi.balanceOf(contracts.feiDAOTimelock.address)).to.be.at.least(
    ethers.constants.WeiPerEther.mul(34490)
  );
};

export { deploy, setup, teardown, validate };
