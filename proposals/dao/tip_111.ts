import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc,
  PcvStats
} from '@custom-types/types';
import { getImpersonatedSigner, overwriteChainlinkAggregator, ZERO_ADDRESS, balance, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

let pcvStatsBefore: PcvStats;
let ethPsmBalanceBefore: BigNumber;
let balancerBalanceBefore: BigNumber;

let initialDaiPCVBalance: BigNumber;
let initialTCDpiBalance: BigNumber;

const fipNumber = 'tip_111';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy Lido stETH/USD oracle
  const chainlinkOracleWrapperFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const chainlinkStEthUsdOracleWrapper = await chainlinkOracleWrapperFactory.deploy(
    addresses.core,
    addresses.chainlinkStEthUsdOracle
  );
  await chainlinkStEthUsdOracleWrapper.deployed();
  logging && console.log(`chainlinkStEthUsdOracleWrapper: ${chainlinkStEthUsdOracleWrapper.address}`);

  // Deploy composite stETH/ETH oracle
  const compositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const compositeStEthEthOracle = await compositeOracleFactory.deploy(
    addresses.core,
    chainlinkStEthUsdOracleWrapper.address,
    addresses.chainlinkEthUsdOracleWrapper,
    true // divide and return A/B, not A*B
  );
  await compositeStEthEthOracle.deployed();
  logging && console.log(`compositeStEthEthOracle: ${compositeStEthEthOracle.address}`);

  // Deploy new PCVDeposit
  const ethLidoPCVDepositFactory = await ethers.getContractFactory('EthLidoPCVDeposit');
  const ethLidoPCVDeposit = await ethLidoPCVDepositFactory.deploy(
    addresses.core,
    {
      _oracle: compositeStEthEthOracle.address,
      _backupOracle: ZERO_ADDRESS,
      _invertOraclePrice: false,
      _decimalsNormalizer: '0'
    },
    addresses.steth,
    addresses.curveStethPool,
    '100' // max 1% slippage
  );
  await ethLidoPCVDeposit.deployTransaction.wait();
  logging && console.log(`ethLidoPCVDeposit: ${ethLidoPCVDeposit.address}`);

  return {
    compositeStEthEthOracle,
    chainlinkStEthUsdOracleWrapper,
    ethLidoPCVDeposit
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  ethPsmBalanceBefore = await contracts.ethPSM.balance();
  balancerBalanceBefore = await contracts.balancerLensBpt30Fei70Weth.balance();

  // make sure TC has enough ETH to run
  await forceEth(addresses.tribalCouncilSafe);
  await forceEth(addresses.tribalCouncilTimelock);

  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, Math.round(ethPrice).toString(), '8');

  // read pcvStats before proposal execution
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();

  // ------------------------------------------------------
  // fip_104b
  // ------------------------------------------------------
  const dpi = contracts.dpi;
  initialTCDpiBalance = await dpi.balanceOf(addresses.tribalCouncilSafe);
  initialDaiPCVBalance = await contracts.compoundDaiPCVDeposit.balance();
  logging && console.log('Initial dai balance: ', initialDaiPCVBalance.toString());

  // Fast forward to end of LPB
  const timeRemaining = await contracts.dpiToDaiLBPSwapper.remainingTime();
  await time.increase(timeRemaining);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const daoSigner: SignerWithAddress = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
  await forceEth(contracts.feiDAOTimelock.address);

  // check the stETH oracle price
  const stethPerEth: number = (await contracts.compositeStEthEthOracle.read())[0] / 1e18;
  expect(stethPerEth).to.be.at.least(0.9);
  expect(stethPerEth).to.be.at.most(1);

  // check the token movements
  const ethPsmBalanceAfter: BigNumber = await contracts.ethPSM.balance();
  const balancerBalanceAfter: BigNumber = await contracts.balancerDepositFeiWeth.balance();
  const ethPsmBalanceIncrease: BigNumber = ethPsmBalanceAfter.sub(ethPsmBalanceBefore);
  const balancerBalanceDecrease: BigNumber = balancerBalanceBefore.sub(balancerBalanceAfter);
  // expect less than 0.1% "slippage" when moving funds
  if (ethPsmBalanceIncrease > balancerBalanceDecrease) {
    expect(ethPsmBalanceIncrease.mul('10000').div(balancerBalanceDecrease)).to.be.at.least('9990');
  } else {
    expect(balancerBalanceDecrease.mul('10000').div(ethPsmBalanceIncrease)).to.be.at.least('9990');
  }

  // check the new contract's state
  expect(await contracts.ethLidoPCVDeposit.oracle()).to.be.equal(contracts.compositeStEthEthOracle.address);
  expect(await contracts.ethLidoPCVDeposit.maximumSlippageBasisPoints()).to.be.equal('100');

  // check the withdrawal from steth PCVDeposit
  const stethBalanceBefore: BigNumber = await contracts.steth.balanceOf(contracts.ethLidoPCVDeposit.address);
  const ethBalanceBefore: BigNumber = await balance.current(addresses.aaveEthPCVDeposit);
  await contracts.ethLidoPCVDeposit.connect(daoSigner).withdraw(addresses.aaveEthPCVDeposit, '1000000000000000000');
  const stethBalanceAfter: BigNumber = await contracts.steth.balanceOf(contracts.ethLidoPCVDeposit.address);
  const ethBalanceAfter: BigNumber = await balance.current(addresses.aaveEthPCVDeposit);
  const stethSpent: BigNumber = stethBalanceBefore.sub(stethBalanceAfter);
  const ethReceived: BigNumber = ethBalanceAfter.sub(ethBalanceBefore);
  expect(stethSpent).to.be.at.least(ethers.constants.WeiPerEther.mul('999').div('1000'));
  expect(stethSpent).to.be.at.most(ethers.constants.WeiPerEther.mul('1001').div('1000'));
  expect(ethReceived).to.be.at.least(ethers.constants.WeiPerEther.mul('90').div('100'));
  expect(ethReceived).to.be.at.most(ethers.constants.WeiPerEther);
  expect(stethBalanceBefore).to.be.at.least(ethers.constants.WeiPerEther.mul(49000));
  expect(stethBalanceBefore).to.be.at.most(ethers.constants.WeiPerEther.mul(51000));

  // --------------------------------------------------------------
  // FIP_104b validation
  // --------------------------------------------------------------
  // 1. Validate withdrawn liquidity destinations
  const sanityCheckDAIAmount: BigNumber = ethers.constants.WeiPerEther.mul(3_200_000);
  const finalDAIDepositBalance: BigNumber = await contracts.compoundDaiPCVDeposit.balance();
  const daiGained: BigNumber = finalDAIDepositBalance.sub(initialDaiPCVBalance);
  expect(daiGained).to.be.bignumber.at.least(sanityCheckDAIAmount);

  const sanityCheckDPIAmount: BigNumber = ethers.constants.WeiPerEther.mul(1500);
  const finalTCDpiBalance: BigNumber = await contracts.dpi.balanceOf(addresses.tribalCouncilSafe);
  const dpiGained: BigNumber = finalTCDpiBalance.sub(initialTCDpiBalance);
  expect(dpiGained).to.be.bignumber.at.least(sanityCheckDPIAmount);

  // display pcvStats
  console.log('----------------------------------------------------');
  console.log(' pcvStatsBefore.protocolControlledValue [M]e18 ', Number(pcvStatsBefore.protocolControlledValue) / 1e24);
  console.log(' pcvStatsBefore.userCirculatingFei      [M]e18 ', Number(pcvStatsBefore.userCirculatingFei) / 1e24);
  console.log(' pcvStatsBefore.protocolEquity          [M]e18 ', Number(pcvStatsBefore.protocolEquity) / 1e24);
  const pcvStatsAfter: PcvStats = await contracts.collateralizationOracle.pcvStats();
  console.log('----------------------------------------------------');
  console.log(' pcvStatsAfter.protocolControlledValue  [M]e18 ', Number(pcvStatsAfter.protocolControlledValue) / 1e24);
  console.log(' pcvStatsAfter.userCirculatingFei       [M]e18 ', Number(pcvStatsAfter.userCirculatingFei) / 1e24);
  console.log(' pcvStatsAfter.protocolEquity           [M]e18 ', Number(pcvStatsAfter.protocolEquity) / 1e24);
  console.log('----------------------------------------------------');
  const pcvDiff = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', Number(pcvDiff) / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', Number(cFeiDiff) / 1e24);
  console.log(' Equity diff                            [M]e18 ', Number(eqDiff) / 1e24);
  console.log('----------------------------------------------------');
};

export { deploy, setup, teardown, validate };
