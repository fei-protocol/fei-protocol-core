import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { forceEth } from '@test/integration/setup/utils';
import { TransactionResponse } from '@ethersproject/providers';
import { expectApprox, getImpersonatedSigner, overwriteChainlinkAggregator, time } from '@test/helpers';
import { BigNumber } from 'ethers';

const toBN = ethers.BigNumber.from;

const CHAINLINK_OHM_ETH_ORACLE = '0x90c2098473852E2F07678Fe1B6d595b1bd9b16Ed';

/*

Tribal Council proposal FIP #107

0. Deploy Chainlink oracle for OHM/ETH
1. Deploy Balancer LBP and initialise auction of ETH for OHM
2. Set Balancer LBP contract as a safe address on the guardian
3. Withdraw $10M ETH from Aave PCVDeposit to the Balancer LBP contract
5. Withdraw ~$530k OHM from x to the Balancer LBP contract
7. Initiate auction by calling forceSwap()
*/

// LBP Swapper config
const LBP_FREQUENCY = 86400 * 14; // 2 weeks in seconds
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(100); // 100 eth, $200k
let poolId; // auction pool id

const fipNumber = '107';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  //////////// 1. Deploy Chainlink Oracle Wrapper for OHM/ETH
  const chainlinkFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const chainlinkOhmOracleWrapper = await chainlinkFactory.deploy(addresses.core, CHAINLINK_OHM_ETH_ORACLE);
  await chainlinkOhmOracleWrapper.deployed();

  logging && console.log('Chainlink OHM oracle deployed to: ', chainlinkOhmOracleWrapper.address);

  ///////////  2. Deploy the Balancer LBP swapper
  // // Amounts:
  // ETH: 5071000000000000000000 (95%), 5071k ETH, ~$10,000,000 at 1 ETH = $1972
  // OHM:  23935000000000 (5%), 23,935 OHM, ~$500,000 at 1 OHM = $20.89 overfunding by 10% and transferring $550k
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');

  // tokenSpent = WETH, tokenReceived = OHM
  // Oracle reports OHM / ETH, therefore is reporting in tokenReceived terms. So, needs inverting
  // DecimalsNormalizer also needs setting.
  // WETH = 18 decimals
  // OHM = 9 decimals
  const ethToOhmLBPSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: chainlinkOhmOracleWrapper.address,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 9
    },
    LBP_FREQUENCY,
    '50000000000000000', // small weight 5%
    '950000000000000000', // large weight 95%
    addresses.weth,
    addresses.ohm,
    addresses.tribalCouncilTimelock, // Send OHM to the TribalCouncil Timelock once LBP has completed
    MIN_LBP_SIZE // minimum size of a pool which the swapper is used against
  );

  await ethToOhmLBPSwapper.deployed();
  logging && console.log('ETH to OHM swapper deployed to: ', ethToOhmLBPSwapper.address);

  // 2. Create a liquidity bootstrapping pool between ETH and OHM
  const lbpFactory = await ethers.getContractAt(
    'ILiquidityBootstrappingPoolFactory',
    addresses.balancerLBPoolFactoryNoFee
  );

  const tx: TransactionResponse = await lbpFactory.create(
    'ETH->OHM Auction Pool', // pool name
    'apETH-OHM', // lbp token symbol
    [addresses.weth, addresses.ohm], // pool contains [WETH, OHM]
    [ethers.constants.WeiPerEther.mul(95).div(100), ethers.constants.WeiPerEther.mul(5).div(100)], // initial weights 5%/95%
    ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
    ethToOhmLBPSwapper.address, // pool owner = fei protocol swapper
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const noFeeEthOhmLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;
  poolId = rawLogs[1].topics[1];

  logging && console.log('LBP Pool deployed to: ', noFeeEthOhmLBPAddress);
  logging && console.log('LBP Pool Id: ', poolId);

  // 3. Initialise the LBP swapper with the pool address
  const tx2 = await ethToOhmLBPSwapper.init(noFeeEthOhmLBPAddress);
  await tx2.wait();

  // 4. Deploy a lens to report the swapper value

  const compositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const ohmUSDCompositeOracle = await compositeOracleFactory.deploy(
    addresses.core,
    addresses.chainlinkEthUsdOracle,
    chainlinkOhmOracleWrapper.address
  );

  await ohmUSDCompositeOracle.deployed();
  const BPTLensFactory = await ethers.getContractFactory('BPTLens');
  const ohmToETHLensOHM = await BPTLensFactory.deploy(
    addresses.ohm, // token reported in
    noFeeEthOhmLBPAddress, // pool address
    ohmUSDCompositeOracle.address, // reportedOracle - OHM
    addresses.chainlinkEthUsdOracle, // otherOracle - ETH
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await ohmToETHLensOHM.deployTransaction.wait();

  logging && console.log('BPTLens for OHM in swapper pool: ', ohmToETHLensOHM.address);

  const ohmToETHLensETH = await BPTLensFactory.deploy(
    addresses.weth, // token reported in
    noFeeEthOhmLBPAddress, // pool address
    addresses.chainlinkEthUsdOracle, // reportedOracle - ETH
    addresses.ohmUSDCompositeOracle, // otherOracle - OHM
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await ohmToETHLensETH.deployTransaction.wait();

  logging && console.log('BPTLens for OHM in swapper pool: ', ohmToETHLensETH.address);
  return {
    ethToOhmLBPSwapper,
    ohmToETHLensOHM,
    ohmToETHLensETH,
    ohmUSDCompositeOracle
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // overwrite chainlink ETH/USD oracle
  const ethToOhmLBPSwapper = contracts.ethToOhmLBPSwapper;

  // TODO: Checkout this overwriting
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '250000000000', '8');

  // invariant checks
  expect(await ethToOhmLBPSwapper.tokenSpent()).to.be.equal(addresses.weth);
  expect(await ethToOhmLBPSwapper.tokenReceived()).to.be.equal(addresses.ohm);
  expect(await ethToOhmLBPSwapper.tokenReceivingAddress()).to.be.equal(addresses.tribalCouncilTimelock);
  expect(await ethToOhmLBPSwapper.duration()).to.be.equal(1_209_600);

  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  expect(poolTokens.tokens[0]).to.be.equal(addresses.weth);
  expect(poolTokens.tokens[1]).to.be.equal(addresses.ohm);

  // LBP swapper should be empty
  expect(poolTokens.balances[0]).to.be.equal('0');
  expect(poolTokens.balances[1]).to.be.equal('0');

  // Lenses should report 0 because LBP is empty
  expect(await contracts.ohmToETHLensOHM.balance()).to.be.equal('0');
  expect(await contracts.ohmToETHLensETH.balance()).to.be.equal('0');

  // Swapper should hold no tokens
  expect(await contracts.weth.balanceOf(ethToOhmLBPSwapper.address)).to.be.equal('0');
  expect(await contracts.ohm.balanceOf(ethToOhmLBPSwapper.address)).to.be.equal('0');
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const core = contracts.core;

  ////////////    1. New Safe adddresses   //////////////
  expect(await contracts.pcvGuardianNew.isSafeAddress(addresses.ohmToEthLBPSwapper)).to.be.true;

  ////////////    2. Chainlink OHM/ETH oracle valid   //////////////
  // TODO

  /////////////  3.    OHM LBP  ////////////////
  await validateLBPSetup(contracts, addresses, poolId);
};

const validateLBPSetup = async (contracts: NamedContracts, addresses: NamedAddresses, poolId: string) => {
  const ethToOhmLBPSwapper = contracts.ethToOhmLBPSwapper;
  const ethToOhmLBPPool = contracts.ethToOhmLBPPool;

  const retrievedPoolId = await ethToOhmLBPSwapper.getPoolId();
  expect(retrievedPoolId).to.equal(poolId);

  expect(await ethToOhmLBPSwapper.isTimeStarted()).to.be.true;
  expect(await ethToOhmLBPSwapper.tokenSpent()).to.equal(addresses.weth);
  expect(await ethToOhmLBPSwapper.tokenReceived()).to.equal(addresses.ohm);
  expect(await ethToOhmLBPPool.getSwapEnabled()).to.equal(true);
  // tokenSpent = WETH
  // tokenReceived = OHm

  // 2.1 Check oracle price
  const price = (await ethToOhmLBPSwapper.readOracle())[0]; // DAI price in units of DPI
  console.log('price: ', price);
  expect(price).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(90)); // 90e18
  expect(price).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(100)); // 100e18

  // 2.2 Check relative price in pool
  // Putting in 100,000 tokens of DPI, getting an amount of DAI back
  const response = await ethToOhmLBPSwapper.getTokensIn(100000); // input is spent token balance, 100,000 DPI tokens
  const amounts = response[1];
  expect(amounts[0]).to.be.bignumber.equal(ethers.BigNumber.from(100000)); // DPI

  // DAI/DPI price * DAI amount * 5% ~= amount
  expectApprox(price.mul(100000).mul(5).div(ethers.constants.WeiPerEther).div(100), amounts[1]); // DAI
  expect(amounts[1]).to.be.bignumber.at.least(toBN(1000)); // Make sure orcacle inversion is correct (i.e. not inverted)

  // 2.3 Check pool weights
  const weights = await ethToOhmLBPPool.getNormalizedWeights();
  expectApprox(weights[0], ethers.constants.WeiPerEther.mul(5).div(100)); // 5% DAI
  expectApprox(weights[1], ethers.constants.WeiPerEther.mul(95).div(100)); // 95% DPI

  // 2.4 Check pool info
  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  // there should be 188k DAI in the pool
  expect(poolTokens.tokens[1]).to.be.equal(contracts.dai.address); // this is DAI
  expect(poolTokens.balances[1]).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(185_000));
  expect(poolTokens.balances[1]).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(200_000));
  // there should be 37k DPI in the pool
  expect(poolTokens.tokens[0]).to.be.equal(contracts.dpi.address); // this is DPI
  expect(poolTokens.balances[0]).to.be.equal('37888449801955370645659');

  // Pool balances Maths:
  // Total value of pool = (188k DAI * $1) + (37k DPI * $93) = $3.63M
  // DAI share = 5%
  // DPI share = 95%
  // Expected DAI amount = $3.63M * 0.05 = ~$181k
  // Expected DPI amount = $3.63M * 0.95 = ~$3.5M -> ~ ($3500k / 93) 37k DPI

  // Validate that a swap can occur
  const daiWhale = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643';
  const daiWhaleSigner = await getImpersonatedSigner(daiWhale);
  await forceEth(daiWhale);

  const initialUserDpiBalance = await contracts.dpi.balanceOf(daiWhale);
  const initialUserDaiBalance = await contracts.dai.balanceOf(daiWhale);

  const amountIn = ethers.constants.WeiPerEther.mul(10_000);
  await contracts.dai.connect(daiWhaleSigner).approve(addresses.balancerVault, amountIn);
  await contracts.balancerVault.connect(daiWhaleSigner).swap(
    {
      poolId: poolId,
      kind: 0,
      assetIn: addresses.dai,
      assetOut: addresses.dpi,
      amount: amountIn,
      userData: '0x'
    },
    {
      sender: daiWhale,
      fromInternalBalance: false,
      recipient: daiWhale,
      toInternalBalance: false
    },
    0,
    '10000000000000000000000'
  );

  const postUserDpiBalance = await contracts.dpi.balanceOf(daiWhale);
  const postUserDaiBalance = await contracts.dai.balanceOf(daiWhale);

  const daiSpent = initialUserDaiBalance.sub(postUserDaiBalance);
  expect(daiSpent).to.be.bignumber.equal(amountIn);

  const dpiGained = postUserDpiBalance.sub(initialUserDpiBalance);
  expect(dpiGained).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(80));
  expect(dpiGained).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(120));

  // Put in 10k DAI, got out 101 DPI
  // Implies price of $98.5 per DPI, compared to an oracle price of $95.6
  console.log('DAI spent: ', daiSpent);
  console.log('DPI gained: ', dpiGained);

  await time.increase(86400 * 7);
  // Perform second swap, check price goes down
  await contracts.dai.connect(daiWhaleSigner).approve(addresses.balancerVault, amountIn);
  await contracts.balancerVault.connect(daiWhaleSigner).swap(
    {
      poolId: poolId,
      kind: 0,
      assetIn: addresses.dai,
      assetOut: addresses.dpi,
      amount: amountIn,
      userData: '0x'
    },
    {
      sender: daiWhale,
      fromInternalBalance: false,
      recipient: daiWhale,
      toInternalBalance: false
    },
    0,
    '10000000000000000000000'
  );
  const secondSwapDPIAmount = (await contracts.dpi.balanceOf(daiWhale)).sub(postUserDpiBalance);
  // If price has dropped, then for the same DAI the user gets more DPI
  expect(secondSwapDPIAmount).to.be.bignumber.greaterThan(dpiGained);

  // Accelerate time and check ended
  await time.increase(LBP_FREQUENCY);
  expect(await ethToOhmLBPSwapper.isTimeEnded()).to.be.true;
};

export { deploy, setup, teardown, validate };
