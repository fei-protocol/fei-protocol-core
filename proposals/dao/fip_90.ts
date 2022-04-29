import { ethers } from 'hardhat';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { overwriteChainlinkAggregator, expectApproxAbs } from '@test/helpers';
import { BigNumberish } from 'ethers';

function e18(x: BigNumberish) {
  return ethers.constants.WeiPerEther.mul(x).toString();
}

const fipNumber = '90';
const balancerBoostedFuseFeiLinearPoolId = '0xc8c79fcd0e859e7ec81118e91ce8e4379a481ee6000000000000000000000196';
const balancerBoostedFuseDaiLinearPoolId = '0x8f4063446f5011bc1c9f79a819efe87776f23704000000000000000000000197';
const balancerBoostedFuseLusdLinearPoolId = '0xb0f75e97a114a4eb4a425edc48990e6760726709000000000000000000000198';
const balancerBoostedFuseUsdStablePoolId = '0xd997f35c9b1281b82c8928039d14cddab5e13c2000000000000000000000019c';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // BB-F-USD Deposit
  const bbfUsdPCVDepositFactory = await ethers.getContractFactory('BalancerPCVDepositBBFUSD');
  const bbfUsdPCVDeposit = await bbfUsdPCVDepositFactory.deploy(addresses.core, 50); // max 0.5% slippage
  await bbfUsdPCVDeposit.deployed();
  logging && console.log('bbfUsdPCVDeposit: ', bbfUsdPCVDeposit.address);

  // Deploy lens to report B-30FEI-70WETH as WETH and protocol-owned FEI
  // (The new contract contains a fix)
  const balancerPool2LensFactory = await ethers.getContractFactory('BalancerPool2Lens');
  const balancerLensBpt30Fei70WethFixed = await balancerPool2LensFactory.deploy(
    addresses.gaugeLensBpt30Fei70WethGauge, // address _depositAddress
    addresses.wethERC20, // address _token
    '0x90291319f1d4ea3ad4db0dd8fe9e12baf749e845', // IWeightedPool _pool
    addresses.chainlinkEthUsdOracleWrapper, // IOracle _reportedOracle
    addresses.oneConstantOracle, // IOracle _otherOracle
    false, // bool _feiIsReportedIn
    true // bool _feiIsOther
  );
  await balancerLensBpt30Fei70WethFixed.deployTransaction.wait();
  logging && console.log('balancerLensBpt30Fei70WethFixed: ', balancerLensBpt30Fei70WethFixed.address);

  return {
    bbfUsdPCVDeposit,
    balancerLensBpt30Fei70WethFixed
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`Setup of fip${fipNumber}...`);

  // make sure oracle of B.AMM is fresh
  // set Chainlink ETHUSD to a fixed 3,000$ value
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '300000000000', '8');

  // make sure the PCVDeposits have enough DAI/LUSD to draw from
  /*const e18 = '000000000000000000';
  const DAI_HOLDER = '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7';
  const LUSD_HOLDER = '0x66017d22b0f8556afdd19fc67041899eb65a21bb';
  await forceEth(DAI_HOLDER);
  await forceEth(LUSD_HOLDER);
  await contracts.dai.connect(await getImpersonatedSigner(DAI_HOLDER)).transfer(contracts.compoundDaiPCVDeposit.address, `50000000${e18}`);
  await contracts.lusd.connect(await getImpersonatedSigner(LUSD_HOLDER)).transfer(contracts.bammDeposit.address, `50000000${e18}`);
  await contracts.compoundDaiPCVDeposit.deposit();
  await contracts.bammDeposit.deposit();*/

  console.log(`Setup done for fip${fipNumber}.`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const tolerance = e18('100000'); // +- 100k (DAI Fuse interests & LUSD>DAI swap slippage)

  // Deposit bb-f-usd balance ~45M
  await expectApproxAbs(
    await contracts.balancerBoostedFuseUsdStablePool.balanceOf(contracts.bbfUsdPCVDeposit.address),
    e18('45000000'),
    tolerance
  );

  // Deposit balance() ~45M
  await expectApproxAbs(await contracts.bbfUsdPCVDeposit.balance(), e18('45000000'), tolerance);

  // Deposit resistant balance ~30M
  await expectApproxAbs((await contracts.bbfUsdPCVDeposit.resistantBalanceAndFei())[0], e18('30000000'), tolerance);
  // Deposit resistant fei ~15M
  await expectApproxAbs((await contracts.bbfUsdPCVDeposit.resistantBalanceAndFei())[1], e18('15000000'), tolerance);

  // Check the new lens
  /*console.log('balancerLensBpt30Fei70WethFixed.balance() (e18)', (await contracts.balancerLensBpt30Fei70WethFixed.balance()) / 1e18);
  console.log(
    'balancerLensBpt30Fei70WethFixed.resistantBalanceAndFei()[0] (e18)',
    (await contracts.balancerLensBpt30Fei70WethFixed.resistantBalanceAndFei())[0] / 1e18
  );
  console.log(
    'balancerLensBpt30Fei70WethFixed.resistantBalanceAndFei()[1] (Me18)',
    (await contracts.balancerLensBpt30Fei70WethFixed.resistantBalanceAndFei())[1] / 1e24
  );*/

  // bb-f-DAI linear pool content
  const daiLinearPoolTokens = await contracts.balancerVault.getPoolTokens(balancerBoostedFuseDaiLinearPoolId);
  await expectApproxAbs(daiLinearPoolTokens.balances[0], e18('3000000'), tolerance); // 3M DAI
  await expectApproxAbs(daiLinearPoolTokens.balances[2], e18('12000000'), tolerance); // 12M 4626-fDAI-8

  // bb-f-LUSD linear pool content
  const lusdLinearPoolTokens = await contracts.balancerVault.getPoolTokens(balancerBoostedFuseLusdLinearPoolId);
  await expectApproxAbs(lusdLinearPoolTokens.balances[0], e18('3000000'), tolerance); // 3M LUSD
  await expectApproxAbs(lusdLinearPoolTokens.balances[1], e18('12000000'), tolerance); // 12M 4626-fLUSD-8

  // bb-f-FEI linear pool content
  const feiLinearPoolTokens = await contracts.balancerVault.getPoolTokens(balancerBoostedFuseFeiLinearPoolId);
  await expectApproxAbs(feiLinearPoolTokens.balances[0], e18('3000000'), tolerance); // 3M FEI
  await expectApproxAbs(feiLinearPoolTokens.balances[2], e18('12000000'), tolerance); // 12M 4626-fFEI-8

  // bb-f-USD stable pool content
  const bbfUsdPoolTokens = await contracts.balancerVault.getPoolTokens(balancerBoostedFuseUsdStablePoolId);
  await expectApproxAbs(bbfUsdPoolTokens.balances[0], e18('15000000'), tolerance); // 15M DAI
  await expectApproxAbs(bbfUsdPoolTokens.balances[1], e18('15000000'), tolerance); // 15M LUSD
  await expectApproxAbs(bbfUsdPoolTokens.balances[2], e18('15000000'), tolerance); // 15M FEI
};

export { deploy, setup, teardown, validate };
