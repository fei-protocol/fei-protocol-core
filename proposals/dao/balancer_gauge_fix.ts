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

  return {
    balancerGaugeStakerImplementation,
    balancerGaugeStaker
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

  // check rewards can be claimed
  await time.increase('3600');
  console.log('BAL balance before claim', (await contracts.bal.balanceOf(addresses.balancerGaugeStaker)) / 1e18);
  await contracts.balancerGaugeStaker.mint(addresses.balancerFeiWethPool);
  console.log('BAL balance after claim ', (await contracts.bal.balanceOf(addresses.balancerGaugeStaker)) / 1e18);

  // check collateralization oracle reports the LP tokens staked

  // check withdraw() can move BAL

  // check withdrawERC20() can unstake gauge & move LP tokens

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
