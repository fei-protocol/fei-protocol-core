import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc,
  NamedContracts
} from '@custom-types/types';
import { overwriteChainlinkAggregator } from '@test/helpers';

const fipNumber = 50;

/*
FIP-50: Yield Improvements

DAO Steps:
  1. Grant OA SWAP_ADMIN_ROLE
  2. Call exitPool
  3. Transfer 10M LUSD to rariPool7
  4. Deposit Pool 7 LUSD
  5. Approve BAMM 89.272m LUSD
  6. Deposit 89.272m LUSD to BAMM
  7. withdraw 12k ETH from Aave to LidoPCVDeposit
  8. withdraw 12k ETH from Compound to LidoPCVDeposit
*/

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging: boolean) => {
  const { feiDAOTimelock } = addresses;

  if (!feiDAOTimelock) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1.
  const factory = await ethers.getContractFactory('BAMMLens');
  const bammLens = await factory.deploy(feiDAOTimelock);

  await bammLens.deployTransaction.wait();

  logging && console.log('bammLens: ', bammLens.address);

  return {
    bammLens
  } as NamedContracts;
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`Setup for fip${fipNumber}`);
  // set Chainlink ETHUSD to a fixed 4,000$ value
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '400000000000', '8');
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Check BAMM holdings via lens
  // expect(await contracts.bammLens.balance()).to.be.at.least(ethers.constants.WeiPerEther.mul(89_000_000));

  // Check balancer LBPSwapper balance is near 0 (note these are still reported in wei)
  const remainingBalances = await contracts.feiLusdLens.resistantBalanceAndFei();
  expect(remainingBalances[0]).to.be.at.most(ethers.constants.WeiPerEther); // < 1 LUSD left
  expect(remainingBalances[1]).to.be.at.most(ethers.constants.WeiPerEther); // < 1 FEI left

  // check Pool7LUSDDeposit holding 10m
  expect(await contracts.rariPool7LusdPCVDeposit.balance()).to.be.bignumber.equal(
    ethers.constants.WeiPerEther.mul(10_000_000)
  );

  // Check CR Oracle
  // Check stETH sitting on about 48k ETH
  expect(await contracts.ethLidoPCVDeposit.balance()).to.be.at.least(ethers.constants.WeiPerEther.mul(48_000));
  expect(await contracts.ethLidoPCVDeposit.balance()).to.be.at.most(ethers.constants.WeiPerEther.mul(49_000));
};

export { deploy, setup, teardown, validate };
