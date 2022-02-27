import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

const fipNumber = '73b';

/*
FIP-73b:

Deploy:
1. Deploy Kashi Redeemer
2. Deploy BarnBridge Redeemer
3. Deploy Idle Best Yield Redeemer
4. Deploy Idle Tranches Redeemer

OA Steps:
1. Transfer all the things
2. Remove the things from CR Oracle

*/

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const optimisticTimelock = addresses.optimisticTimelock;

  const kashiFactory = await ethers.getContractFactory('KashiPCVRedeemer');
  const kashiRedeemer = await kashiFactory.deploy(optimisticTimelock);
  await kashiRedeemer.deployed();
  logging && console.log('kashiRedeemer: ', kashiRedeemer.address);

  const idleTranchesFactory = await ethers.getContractFactory('IdleTranchePCVRedeemer');
  const idleTranchesRedeemer = await idleTranchesFactory.deploy(optimisticTimelock, addresses.idleTranchesMinter);
  await idleTranchesRedeemer.deployed();
  logging && console.log('idleTranchesRedeemer: ', idleTranchesRedeemer.address);

  const idleFactory = await ethers.getContractFactory('IdlePCVRedeemer');
  const idleRedeemer = await idleFactory.deploy(optimisticTimelock, addresses.idleBestYield);
  await idleRedeemer.deployed();
  logging && console.log('idleRedeemer: ', idleRedeemer.address);

  const bbFactory = await ethers.getContractFactory('SmartYieldRedeemer');
  const bbRedeemer = await bbFactory.deploy(optimisticTimelock, addresses.fei);
  await bbRedeemer.deployed();
  logging && console.log('bbRedeemer: ', bbRedeemer.address);

  return {
    kashiRedeemer,
    idleTranchesRedeemer,
    idleRedeemer,
    bbRedeemer
  };
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log('Balance Before:');
  console.log(await contracts.fei.balanceOf(addresses.optimisticTimelock));
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { bbRedeemer, idleRedeemer, idleTranchesRedeemer, kashiRedeemer } = contracts;
  const { barnbridgeAFei, kashiFeiDPI, kashiFeiEth, kashiFeiTribe, kashiFeiXSushi } = addresses;

  console.log(`Teardown:`);

  await bbRedeemer.redeem(barnbridgeAFei, ethers.constants.WeiPerEther.mul(300_000));
  await idleTranchesRedeemer.redeem(ethers.constants.WeiPerEther.mul(300_000));
  await idleRedeemer.redeem(ethers.constants.WeiPerEther.mul(1_000_000));
  await kashiRedeemer.redeem(kashiFeiDPI, ethers.constants.WeiPerEther.mul(300_000));
  await kashiRedeemer.redeem(kashiFeiEth, ethers.constants.WeiPerEther.mul(1_000_000));
  await kashiRedeemer.redeem(kashiFeiTribe, ethers.constants.WeiPerEther.mul(1_000_000));
  await kashiRedeemer.redeem(kashiFeiXSushi, ethers.constants.WeiPerEther.mul(1_000_000));
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log('Balance After:');
  console.log(await contracts.fei.balanceOf(addresses.optimisticTimelock));
  expect(await contracts.namedStaticPCVDepositWrapper.feiReportBalance()).to.be.equal(
    ethers.constants.WeiPerEther.mul(50_000_000)
  );
  expect(await contracts.namedStaticPCVDepositWrapper.numDeposits()).to.be.equal(2); // INDEX and LaaS
};

export { deploy, setup, teardown, validate };
