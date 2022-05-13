import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, overwriteChainlinkAggregator, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

const e18 = '000000000000000000';
const fipNumber = 'balancer_gauge_fix';
let pcvStatsBefore;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy balancer gauge staker implementation
  const balancerGaugeStakerFactory = await ethers.getContractFactory('BalancerGaugeStaker');
  const balancerGaugeStakerImplementation = await balancerGaugeStakerFactory.deploy(
    addresses.core // address _core
  );
  await balancerGaugeStakerImplementation.deployTransaction.wait();
  logging && console.log('balancerGaugeStakerImplementation: ', balancerGaugeStakerImplementation.address);

  // Deploy balancer gauge staker proxy
  const ProxyFactory = await ethers.getContractFactory('TransparentUpgradeableProxy');
  const balancerGaugeStakerProxy = await ProxyFactory.deploy(
    balancerGaugeStakerImplementation.address,
    addresses.proxyAdmin,
    '0x' // empty calldata
  );
  await balancerGaugeStakerProxy.deployTransaction.wait();
  const balancerGaugeStaker = await ethers.getContractAt('BalancerGaugeStaker', balancerGaugeStakerProxy.address);
  logging && console.log('balancerGaugeStaker: ', balancerGaugeStaker.address);

  // initialize proxy state
  await balancerGaugeStaker.initialize(addresses.core);

  // Deploy lens to report the B-30FEI-70WETH staked in gauge
  const gaugeLensFactory = await ethers.getContractFactory('CurveGaugeLens');
  const gaugeLensBpt30Fei70WethGauge = await gaugeLensFactory.deploy(
    addresses.balancerGaugeBpt30Fei70Weth,
    balancerGaugeStaker.address
  );
  await gaugeLensBpt30Fei70WethGauge.deployTransaction.wait();
  logging && console.log('gaugeLensBpt30Fei70WethGauge:', gaugeLensBpt30Fei70WethGauge.address);

  // Deploy lens to report B-30FEI-70WETH as WETH and protocol-owned FEI
  const balancerPool2LensFactory = await ethers.getContractFactory('BalancerPool2Lens');
  const balancerLensBpt30Fei70Weth = await balancerPool2LensFactory.deploy(
    gaugeLensBpt30Fei70WethGauge.address, // address _depositAddress
    addresses.wethERC20, // address _token
    '0x90291319f1d4ea3ad4db0dd8fe9e12baf749e845', // IWeightedPool _pool
    addresses.chainlinkEthUsdOracleWrapper, // IOracle _reportedOracle
    addresses.oneConstantOracle, // IOracle _otherOracle
    false, // bool _feiIsReportedIn
    true // bool _feiIsOther
  );
  await balancerLensBpt30Fei70Weth.deployTransaction.wait();
  logging && console.log('balancerLensBpt30Fei70Weth: ', balancerLensBpt30Fei70Weth.address);

  return {
    balancerGaugeStakerImplementation,
    balancerGaugeStaker,
    gaugeLensBpt30Fei70WethGauge,
    balancerLensBpt30Fei70Weth
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`Setup of ${fipNumber} : reading CR oracle...`);

  // make sure TC has enough ETH to run
  await forceEth(addresses.tribalCouncilSafe);
  await forceEth(addresses.tribalCouncilTimelock);

  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, Math.round(ethPrice), '8');

  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // assume non-zero B-70WETH-30FEI were unstaked & moved to the PCVDeposit
  // before this proposal's execution.
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  const lpTokenHolder = '0x4f9463405f5bc7b4c1304222c1df76efbd81a407';
  const lpTokenSigner = await getImpersonatedSigner(lpTokenHolder);
  await forceEth(lpTokenHolder);
  await contracts.balancerFeiWethPool.connect(lpTokenSigner).transfer(addresses.balancerDepositFeiWeth, `1000${e18}`);

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
  // check the new staking contract has staked in gauge
  console.log('---------------------------------------------------------------');
  console.log(
    'BPTs staked in the gauge by the new contract',
    (await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(addresses.balancerGaugeStaker)) / 1e18
  );

  // check rewards can be claimed
  console.log('---------------------------------------------------------------');
  console.log('claim rewards...');
  await time.increase('86400');
  console.log('BAL balance before claim', (await contracts.bal.balanceOf(addresses.balancerGaugeStaker)) / 1e18);
  await contracts.balancerGaugeStaker.mint(addresses.balancerFeiWethPool);
  console.log('BAL balance after claim ', (await contracts.bal.balanceOf(addresses.balancerGaugeStaker)) / 1e18);
  console.log('balancerGaugeStaker.balance() ', (await contracts.balancerGaugeStaker.balance()) / 1e18);

  // check collateralization oracle reports the LP tokens staked
  console.log('---------------------------------------------------------------');
  console.log('checking presence in CR oracle');
  expect(await contracts.collateralizationOracle.depositToToken(addresses.balancerLensBpt30Fei70Weth)).to.be.equal(
    addresses.weth
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.balancerLensBpt30Fei70WethOld)).to.be.equal(
    ethers.constants.AddressZero
  );
  console.log('checking resistant balance and fei');
  const resistantBalanceAndFei = await contracts.balancerLensBpt30Fei70Weth.resistantBalanceAndFei();
  console.log('resistantBalanceAndFei[0]', resistantBalanceAndFei[0] / 1e18);
  console.log('resistantBalanceAndFei[1]', resistantBalanceAndFei[1] / 1e18);

  // check withdraw() can move BAL
  console.log('---------------------------------------------------------------');
  console.log('withdraw(feiDAOTimelock, 1e18)');
  const withdrawAmount = '1000000000000000000';
  const sourceBalanceBefore = await contracts.bal.balanceOf(addresses.balancerGaugeStaker);
  const targetBalanceBefore = await contracts.bal.balanceOf(addresses.feiDAOTimelock);
  console.log('BAL balance before withdraw [source]', sourceBalanceBefore / 1e18);
  console.log('BAL balance before withdraw [target]', targetBalanceBefore / 1e18);
  await contracts.balancerGaugeStaker.withdraw(addresses.feiDAOTimelock, withdrawAmount);
  const sourceBalanceAfter = await contracts.bal.balanceOf(addresses.balancerGaugeStaker);
  const targetBalanceAfter = await contracts.bal.balanceOf(addresses.feiDAOTimelock);
  console.log('BAL balance after  withdraw [source]', sourceBalanceAfter / 1e18);
  console.log('BAL balance after  withdraw [target]', targetBalanceAfter / 1e18);

  // check withdrawERC20() can unstake gauge & move LP tokens
  console.log('---------------------------------------------------------------');
  console.log('withdrawERC20(bpt30Fei70Weth, feiDAOTimelock, 1e18)');
  const lpWithdrawAmount = '1000000000000000000';
  const sourceLpBalanceBefore = await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(addresses.balancerGaugeStaker);
  const targetLpBalanceBefore = await contracts.bpt30Fei70Weth.balanceOf(addresses.feiDAOTimelock);
  console.log('LP balance before withdraw [source]', sourceLpBalanceBefore / 1e18);
  console.log('LP balance before withdraw [target]', targetLpBalanceBefore / 1e18);
  await contracts.balancerGaugeStaker.withdrawERC20(
    addresses.bpt30Fei70Weth,
    addresses.feiDAOTimelock,
    lpWithdrawAmount
  );
  const sourceLpBalanceAfter = await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(addresses.balancerGaugeStaker);
  const targetLpBalanceAfter = await contracts.bpt30Fei70Weth.balanceOf(addresses.feiDAOTimelock);
  console.log('LP balance after  withdraw [source]', sourceLpBalanceAfter / 1e18);
  console.log('LP balance after  withdraw [target]', targetLpBalanceAfter / 1e18);

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
