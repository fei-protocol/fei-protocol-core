import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc,
  NamedContracts
} from '@custom-types/types';

chai.use(CBN(ethers.BigNumber));

const fipNumber = 50;

/*
FIP-50: Yield Improvements

Deploy Steps:
  1. BAMM Deposit
  2. Deploy RatioPCVControllerV2

DAO Steps:
  0. Grant PCVController to RatioPCVControllerV2
  1. Grant OA SWAP_ADMIN_ROLE
  2. Call exitPool
  3. Transfer 10M LUSD to rariPool7
  4. Deposit Pool 7 LUSD
  5. Approve RatioControllerv2 for 1bn LUSD
  6. Withdraw 100% of LUSD to BAMMDeposit
  7. withdraw 12k ETH from Aave to LidoPCVDeposit
  8. withdraw 12k ETH from Compound to LidoPCVDeposit
  9. Deposit Lido
  10. Remove LUSD Lens from CR Oracle
  11. Add BAMM Deposit to CR Oracle
  12. Revoke old PCV Controller
*/

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging: boolean) => {
  const { core } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1. BAMM Deposit
  const factory = await ethers.getContractFactory('BAMMDeposit');
  const bammDeposit = await factory.deploy(core);

  await bammDeposit.deployTransaction.wait();

  logging && console.log('bammDeposit: ', bammDeposit.address);

  // 2. Ratio Factory
  const ratioFactory = await ethers.getContractFactory('RatioPCVControllerV2');
  const ratioPCVControllerV2 = await ratioFactory.deploy(core);

  await ratioPCVControllerV2.deployTransaction.wait();

  logging && console.log('ratioPCVControllerV2: ', ratioPCVControllerV2.address);

  return {
    bammDeposit,
    ratioPCVControllerV2
  } as NamedContracts;
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No setup for fip${fipNumber}`);
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  expect(await contracts.lusd.balanceOf(addresses.feiDAOTimelock)).to.be.equal(ethers.constants.Zero);
  expect(await contracts.fei.balanceOf(addresses.feiDAOTimelock)).to.be.equal(ethers.constants.Zero);

  // Check LUSD balance BAMM deposit
  expect(await contracts.lusd.balanceOf(addresses.bammDeposit)).to.be.at.least(
    ethers.constants.WeiPerEther.mul(89_000_000)
  );

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
