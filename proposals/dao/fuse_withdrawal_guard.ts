import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '@custom-types/types';
import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';

chai.use(CBN(ethers.BigNumber));

const e18 = ethers.constants.WeiPerEther;

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  const {
    core,
    fei,
    lusd,
    dai,
    rariPool8FeiPCVDeposit,
    rariPool8DaiPCVDeposit,
    rariPool8LusdPCVDeposit,
    rariPool79FeiPCVDeposit,
    rariPool128FeiPCVDeposit,
    rariPool22FeiPCVDeposit,
    rariPool24FeiPCVDeposit,
    rariPool18FeiPCVDeposit,
    rariPool6FeiPCVDeposit,
    turboFusePCVDeposit,
    lusdPSM,
    daiFixedPricePSM
  } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  const factory = await ethers.getContractFactory('FuseWithdrawalGuard');
  const fuseWithdrawalGuard = await factory.deploy(
    core,
    [
      rariPool8FeiPCVDeposit,
      rariPool8DaiPCVDeposit,
      rariPool8LusdPCVDeposit,
      rariPool79FeiPCVDeposit,
      rariPool128FeiPCVDeposit,
      rariPool22FeiPCVDeposit,
      rariPool24FeiPCVDeposit,
      rariPool18FeiPCVDeposit,
      rariPool6FeiPCVDeposit,
      turboFusePCVDeposit
    ],
    [
      daiFixedPricePSM,
      daiFixedPricePSM,
      lusdPSM,
      daiFixedPricePSM,
      daiFixedPricePSM,
      daiFixedPricePSM,
      daiFixedPricePSM,
      daiFixedPricePSM,
      daiFixedPricePSM,
      daiFixedPricePSM
    ],
    [fei, dai, lusd, fei, fei, fei, fei, fei, fei, fei],
    [e18.mul(191_000), e18.mul(64_000), e18.mul(4_000), e18.mul(100_000), 0, 0, 0, 0, 0, 0]
  );

  logging && console.log('FuseWithdrawalGuard deployed to: ', fuseWithdrawalGuard.address);

  return { fuseWithdrawalGuard };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  await contracts.pcvSentinel.knight(addresses.fuseWithdrawalGuard);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const guard = contracts.fuseWithdrawalGuard;
  expect(await guard.getAmountToWithdraw(addresses.rariPool8FeiPCVDeposit)).to.be.gt(e18.mul(2_700_000));
  expect(await guard.getAmountToWithdraw(addresses.rariPool8DaiPCVDeposit)).to.be.gt(e18.mul(120_000));
  expect(await guard.getAmountToWithdraw(addresses.rariPool8LusdPCVDeposit)).to.be.gt(e18.mul(900_000));
  expect(await guard.getAmountToWithdraw(addresses.rariPool79FeiPCVDeposit)).to.be.gt(e18.mul(1_100_000));
  expect(await guard.getAmountToWithdraw(addresses.rariPool128FeiPCVDeposit)).to.be.gt(e18.mul(20_000));
  expect(await guard.getAmountToWithdraw(addresses.rariPool22FeiPCVDeposit)).to.be.gt(e18.mul(20_000));
  expect(await guard.getAmountToWithdraw(addresses.rariPool24FeiPCVDeposit)).to.be.gt(e18.mul(500));
  expect(await guard.getAmountToWithdraw(addresses.rariPool18FeiPCVDeposit)).to.be.gt(e18.mul(20_000));
  expect(await guard.getAmountToWithdraw(addresses.rariPool6FeiPCVDeposit)).to.be.gt(e18.mul(100));
  expect(await guard.getAmountToWithdraw(addresses.turboFusePCVDeposit)).to.be.gt(e18.mul(10_000_000));

  const lusdPSMBalanceBefore = await contracts.lusd.balanceOf(addresses.lusdPSM);
  const daiPSMBalanceBefore = await contracts.dai.balanceOf(addresses.daiFixedPricePSM);
  const daiPSMFeiBalanceBefore = await contracts.fei.balanceOf(addresses.daiFixedPricePSM);

  for (let i = 0; i < 10; i++) {
    expect(await guard.check()).to.be.true;
    await contracts.pcvSentinel.protec(guard.address);
  }
  expect(await guard.check()).to.be.false;
  expect(await guard.getAmountToWithdraw(addresses.rariPool8FeiPCVDeposit)).to.be.equal(e18.mul(0));
  expect(await guard.getAmountToWithdraw(addresses.rariPool8DaiPCVDeposit)).to.be.equal(e18.mul(0));
  expect(await guard.getAmountToWithdraw(addresses.rariPool8LusdPCVDeposit)).to.be.equal(e18.mul(0));
  expect(await guard.getAmountToWithdraw(addresses.rariPool79FeiPCVDeposit)).to.be.equal(e18.mul(0));
  expect(await guard.getAmountToWithdraw(addresses.rariPool128FeiPCVDeposit)).to.be.equal(e18.mul(0));
  expect(await guard.getAmountToWithdraw(addresses.rariPool22FeiPCVDeposit)).to.be.equal(e18.mul(0));
  expect(await guard.getAmountToWithdraw(addresses.rariPool24FeiPCVDeposit)).to.be.equal(e18.mul(0));
  expect(await guard.getAmountToWithdraw(addresses.rariPool18FeiPCVDeposit)).to.be.equal(e18.mul(0));
  expect(await guard.getAmountToWithdraw(addresses.rariPool6FeiPCVDeposit)).to.be.equal(e18.mul(0));
  expect(await guard.getAmountToWithdraw(addresses.turboFusePCVDeposit)).to.be.equal(e18.mul(0));

  expect(await contracts.lusd.balanceOf(addresses.lusdPSM)).to.be.gt(e18.mul(900_000).add(lusdPSMBalanceBefore));
  expect(await contracts.dai.balanceOf(addresses.daiFixedPricePSM)).to.be.gt(e18.mul(120_000).add(daiPSMBalanceBefore));
  expect(await contracts.fei.balanceOf(addresses.daiFixedPricePSM)).to.be.gt(
    e18.mul(13_800_000).add(daiPSMFeiBalanceBefore)
  );
};

export { deploy, setup, teardown, validate };
