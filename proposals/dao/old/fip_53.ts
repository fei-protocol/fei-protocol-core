import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../types/types';
import { time, getImpersonatedSigner } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));
const e18 = (x) => ethers.constants.WeiPerEther.mul(x);

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const curvePCVDepositFactory = await ethers.getContractFactory('CurvePCVDepositPlainPool');
  const d3poolCurvePCVDeposit = await curvePCVDepositFactory.deploy(
    addresses.core,
    addresses.curveD3pool,
    '50' // 0.5% maximum slippage
  );

  await d3poolCurvePCVDeposit.deployTransaction.wait();

  logging && console.log('d3pool Curve PCV Deposit :', d3poolCurvePCVDeposit.address);

  const convexPCVDepositFactory = await ethers.getContractFactory('ConvexPCVDeposit');
  const d3poolConvexPCVDeposit = await convexPCVDepositFactory.deploy(
    addresses.core,
    addresses.curveD3pool,
    addresses.convexBooster,
    addresses.convexD3poolRewards
  );

  await d3poolConvexPCVDeposit.deployTransaction.wait();

  logging && console.log('d3pool Convex PCV Deposit :', d3poolConvexPCVDeposit.address);

  return {
    d3poolCurvePCVDeposit,
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
  // Balances should be reported in USD
  expect(await contracts.d3poolCurvePCVDeposit.balanceReportedIn()).to.be.equal(
    '0x1111111111111111111111111111111111111111'
  );
  expect(await contracts.d3poolConvexPCVDeposit.balanceReportedIn()).to.be.equal(
    '0x1111111111111111111111111111111111111111'
  );

  // Deposits should be added to CR oracle
  expect(await contracts.collateralizationOracle.depositToToken(contracts.d3poolCurvePCVDeposit.address)).to.be.equal(
    '0x1111111111111111111111111111111111111111'
  );
  expect(await contracts.collateralizationOracle.depositToToken(contracts.d3poolConvexPCVDeposit.address)).to.be.equal(
    '0x1111111111111111111111111111111111111111'
  );

  // Sanity check : There should be nothing left on the Curve deposit
  expect(await contracts.d3poolCurvePCVDeposit.balance()).to.be.at.most(e18('1000'));
  const resistantBalanceAndFeiOnCurve = await contracts.d3poolCurvePCVDeposit.resistantBalanceAndFei();
  expect(resistantBalanceAndFeiOnCurve[0]).to.be.at.most(e18('1000'));
  expect(resistantBalanceAndFeiOnCurve[1]).to.be.at.most(e18('1000'));

  // Sanity check : instantaneous balance should be at least 10M
  // It is less than 50M, because the pool should contain at lot of FEI after this proposal execution
  expect(await contracts.d3poolConvexPCVDeposit.balance()).to.be.at.least(e18('10000000'));

  // Sanity check : resistant balance and FEI should give ~33.33M$ and ~16.67M FEI
  const resistantBalanceAndFei = await contracts.d3poolConvexPCVDeposit.resistantBalanceAndFei();
  expect(resistantBalanceAndFei[0]).to.be.at.least(e18('33000000'));
  expect(resistantBalanceAndFei[1]).to.be.at.least(e18('16500000'));

  // Convex rewards should have the LP tokens of the deposit staked
  const lpTokensStaked = await contracts.convexD3poolRewards.balanceOf(contracts.d3poolConvexPCVDeposit.address);
  expect(lpTokensStaked).to.be.at.least(e18('49500000'));
};
