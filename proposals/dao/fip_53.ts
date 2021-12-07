import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../types/types';
import { time, getImpersonatedSigner } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));
const e18 = (x) => ethers.constants.WeiPerEther.mul(x);

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const convexPCVDepositFactory = await ethers.getContractFactory('ConvexPCVDeposit');
  const d3poolConvexPCVDeposit = await convexPCVDepositFactory.deploy(
    addresses.core,
    addresses.curveD3pool,
    addresses.convexBooster,
    addresses.convexD3poolRewards,
    '50' // 0.5% maximum slippage
  );

  await d3poolConvexPCVDeposit.deployTransaction.wait();

  logging && console.log('d3pool Convex PCV Deposit :', d3poolConvexPCVDeposit.address);

  return {
    d3poolConvexPCVDeposit
  };
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup for FIP-53');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-53');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  // Balance should be reported in USD
  expect(await contracts.d3poolConvexPCVDeposit.balanceReportedIn()).to.be.equal(
    '0x1111111111111111111111111111111111111111'
  );

  // Deposit should be added to CR oracle
  expect(await contracts.collateralizationOracle.depositToToken(contracts.d3poolConvexPCVDeposit.address)).to.be.equal(
    '0x1111111111111111111111111111111111111111'
  );

  // Sanity check : instantaneous balance should be at least 10M
  // It is less than 50M, because the pool should contain at lot of FEI after this proposal execution
  expect(await contracts.d3poolConvexPCVDeposit.balance()).to.be.at.least(e18('10000000'));

  // Sanity check : resistant balance and FEI should give ~33.33M$ and ~16.67M FEI
  const resistantBalanceAndFei = await contracts.d3poolConvexPCVDeposit.resistantBalanceAndFei();
  expect(resistantBalanceAndFei[0]).to.be.at.least(e18('33000000'));
  expect(resistantBalanceAndFei[1]).to.be.at.least(e18('16500000'));

  // Convex rewards should have the LP tokens of the deposit staked
  expect(await contracts.convexD3poolRewards.balanceOf(contracts.d3poolConvexPCVDeposit.address)).to.be.at.least(
    e18('49500000')
  );

  // this call should do nothing (no time passed, so CRV and CVX balance is 0),
  // but it should at least not revert.
  await contracts.d3poolConvexPCVDeposit.claimRewards();

  // Check what would happen if we wanted to exit the pool
  // We should have around ~50M stablecoins (mix of FRAX, FEI, alUSD).
  await contracts.d3poolConvexPCVDeposit.exitPool();
  const fraxBalance = await contracts.frax.balanceOf(addresses.d3poolConvexPCVDeposit);
  const feiBalance = await contracts.fei.balanceOf(addresses.d3poolConvexPCVDeposit);
  const alUsdBalance = await contracts.alusd.balanceOf(addresses.d3poolConvexPCVDeposit);
  const stablecoinSum = fraxBalance.add(feiBalance).add(alUsdBalance);
  expect(stablecoinSum).to.be.at.least(e18('49500000'));
};
