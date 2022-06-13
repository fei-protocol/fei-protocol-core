import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, overwriteChainlinkAggregator, ZERO_ADDRESS, balance } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumberish } from 'ethers';

let pcvStatsBefore: any; // sorry klob
let aaveBalanceBefore: any;
let balancerBalanceBefore: any;

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
    false // divide and return A/B, not A*B
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
  aaveBalanceBefore = await contracts.aaveEthPCVDeposit.balance();
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
  const aaveBalanceAfter: any = await contracts.aaveEthPCVDeposit.balance();
  const balancerBalanceAfter: any = await contracts.balancerDepositFeiWeth.balance();
  const aaveBalanceIncrease: any = aaveBalanceAfter.sub(aaveBalanceBefore) / 1e18;
  const balancerBalanceDecrease: any = balancerBalanceBefore.sub(balancerBalanceAfter) / 1e18;
  const ratio: any =
    aaveBalanceIncrease > balancerBalanceDecrease
      ? aaveBalanceIncrease / balancerBalanceDecrease
      : balancerBalanceDecrease / aaveBalanceIncrease;
  expect(ratio).to.be.at.least(1);
  expect(ratio).to.be.at.most(1.001);

  // check the new contract's state
  expect(await contracts.ethLidoPCVDeposit.oracle()).to.be.equal(contracts.compositeStEthEthOracle.address);
  expect(await contracts.ethLidoPCVDeposit.maximumSlippageBasisPoints()).to.be.equal('100');

  // check the withdrawal from steth PCVDeposit
  const stethBalanceBefore: any = (await contracts.steth.balanceOf(contracts.ethLidoPCVDeposit.address)) / 1e18;
  const ethBalanceBefore: any = Number((await balance.current(addresses.aaveEthPCVDeposit)).toString()) / 1e18;
  await contracts.ethLidoPCVDeposit.connect(daoSigner).withdraw(addresses.aaveEthPCVDeposit, '1000000000000000000');
  const stethBalanceAfter: any = (await contracts.steth.balanceOf(contracts.ethLidoPCVDeposit.address)) / 1e18;
  const ethBalanceAfter: any = Number((await balance.current(addresses.aaveEthPCVDeposit)).toString()) / 1e18;
  const stethSpent: any = stethBalanceBefore - stethBalanceAfter;
  const ethReceived: any = ethBalanceAfter - ethBalanceBefore;
  expect(stethSpent).to.be.at.least(0.999);
  expect(stethSpent).to.be.at.most(1.001);
  expect(ethReceived).to.be.at.least(0.9);
  expect(ethReceived).to.be.at.most(1);

  // display pcvStats
  console.log('----------------------------------------------------');
  console.log(' pcvStatsBefore.protocolControlledValue [M]e18 ', pcvStatsBefore.protocolControlledValue / 1e24);
  console.log(' pcvStatsBefore.userCirculatingFei      [M]e18 ', pcvStatsBefore.userCirculatingFei / 1e24);
  console.log(' pcvStatsBefore.protocolEquity          [M]e18 ', pcvStatsBefore.protocolEquity / 1e24);
  const pcvStatsAfter = await contracts.collateralizationOracle.pcvStats();
  console.log('----------------------------------------------------');
  console.log(' pcvStatsAfter.protocolControlledValue  [M]e18 ', pcvStatsAfter.protocolControlledValue / 1e24);
  console.log(' pcvStatsAfter.userCirculatingFei       [M]e18 ', pcvStatsAfter.userCirculatingFei / 1e24);
  console.log(' pcvStatsAfter.protocolEquity           [M]e18 ', pcvStatsAfter.protocolEquity / 1e24);
  console.log('----------------------------------------------------');
  const pcvDiff = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', pcvDiff / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', cFeiDiff / 1e24);
  console.log(' Equity diff                            [M]e18 ', eqDiff / 1e24);
  console.log('----------------------------------------------------');
};

export { deploy, setup, teardown, validate };
