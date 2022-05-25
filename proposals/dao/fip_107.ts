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

const toBN = ethers.BigNumber.from;

const CHAINLINK_OHM_V2_ETH_ORACLE = '0x9a72298ae3886221820b1c878d12d872087d3a23';
const DECIMAL_FACTOR = 1e9;

// NOTE: Think my oracle for OHM is reporting v1 price, not v2. V1: $60, V2: $20

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
  const chainlinkOhmV2OracleWrapper = await chainlinkFactory.deploy(addresses.core, CHAINLINK_OHM_V2_ETH_ORACLE);
  await chainlinkOhmV2OracleWrapper.deployed();

  logging && console.log('Chainlink OHM oracle deployed to: ', chainlinkOhmV2OracleWrapper.address);

  ///////////  2. Deploy the Balancer LBP swapper
  // // Amounts:
  // ETH: 5071000000000000000000 (95%), 5071 ETH, ~$10,000,000 at 1 ETH = $1972
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
      _oracle: chainlinkOhmV2OracleWrapper.address,
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
    chainlinkOhmV2OracleWrapper.address
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
    ohmUSDCompositeOracle,
    chainlinkOhmV2OracleWrapper
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
  const price = (await ethToOhmLBPSwapper.readOracle())[0]; // OHM in units of ETH
  console.log('price: ', price);
  expect(price).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(15).div(DECIMAL_FACTOR)); // $15
  expect(price).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(25).div(DECIMAL_FACTOR)); // $25

  // 2.2 Check relative price in pool
  // Putting in 3 ETH, getting an amount of OHM back
  const response = await ethToOhmLBPSwapper.getTokensIn(3); // input is spent token balance, 3 ETH
  const amounts = response[1];
  expect(amounts[0]).to.be.bignumber.equal(ethers.BigNumber.from(3)); // ETH

  // OHM/ETH price * OHM amount * 5% ~= amount
  expectApprox(price.mul(3).mul(5).div(ethers.constants.WeiPerEther).div(100), amounts[1]); // OHM
  expect(amounts[1]).to.be.bignumber.at.least(toBN(1000)); // Make sure orcacle inversion is correct (i.e. not inverted)

  // 2.3 Check pool weights
  const weights = await ethToOhmLBPPool.getNormalizedWeights();
  expectApprox(weights[0], ethers.constants.WeiPerEther.mul(5).div(100)); // 5% OHM
  expectApprox(weights[1], ethers.constants.WeiPerEther.mul(95).div(100)); // 95% ETH

  // 2.4 Check pool info
  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  // there should be 24k OHM in the pool. It has 9 decimals
  expect(poolTokens.tokens[1]).to.be.equal(contracts.dai.address); // this is DAI
  expect(poolTokens.balances[1]).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(22_000).div(DECIMAL_FACTOR));
  expect(poolTokens.balances[1]).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(26_000).div(DECIMAL_FACTOR));
  // there should be 5071k ETH in the pool
  expect(poolTokens.tokens[0]).to.be.equal(contracts.weth.address); // this is ETH
  expect(poolTokens.balances[0]).to.be.equal('5071000000000000000000');

  // Pool balances Maths:
  // Total value of pool = (24k OHM * $20) + (5071 ETH * $1958) = $10.4M
  // OHM share = 5%
  // ETH share = 95%
  // Expected OHM amount = $10.4M * 0.05 = ~$520k
  // Expected ETH amount = $10.4M * 0.95 = ~$9.9M -> ~ ($9900k / 2958) 5045 eth

  // Validate that a swap can occur
  const ohmWhale = '0x245cc372C84B3645Bf0Ffe6538620B04a217988B'; // Olympus DAO funds
  const ohmWhaleSigner = await getImpersonatedSigner(ohmWhale);
  await forceEth(ohmWhale);

  // Make an ETH buy. User sends in OHM, to purchase ETH. See what the price reported for OHM is. Should be higher than oracle reported price
  const initialUserWethBalance = await contracts.weth.balanceOf(ohmWhale);
  const initialUserOhmBalance = await contracts.ohm.balanceOf(ohmWhale);

  // 1000 OHM buy, ~$20k, so expect ~5 - 15 eth out
  const amountIn = ethers.constants.WeiPerEther.mul(100).div(DECIMAL_FACTOR); // 1000 OHM buy, ~$20k purchase
  await contracts.ohm.connect(ohmWhaleSigner).approve(addresses.balancerVault, amountIn);
  await contracts.balancerVault.connect(ohmWhaleSigner).swap(
    {
      poolId: poolId,
      kind: 0,
      assetIn: addresses.ohm,
      assetOut: addresses.weth,
      amount: amountIn,
      userData: '0x'
    },
    {
      sender: ohmWhale,
      fromInternalBalance: false,
      recipient: ohmWhale,
      toInternalBalance: false
    },
    0,
    '10000000000000000000000'
  );

  const postUserWethBalance = await contracts.weth.balanceOf(ohmWhale);
  const postUserOhmBalance = await contracts.ohm.balanceOf(ohmWhale);

  // Spent OHM, so starting OHM balance will be less than final balance
  const ohmSpent = initialUserOhmBalance.sub(postUserOhmBalance);
  console.log('OHM spent: ', ohmSpent.toString());
  expect(ohmSpent).to.be.bignumber.equal(amountIn);

  // Gained WETH, so final WETH balance will be greater than initial WETH balance
  const wethGained = postUserWethBalance.sub(initialUserWethBalance);
  console.log('Weth gained: ', wethGained.toString());
  expect(wethGained).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(5));
  expect(wethGained).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(15));

  // Put in ~$20k OHM, got out x
  // Implies price of $x per ETH, compared to an oracle price of $x
  console.log('OHM spent: ', ohmSpent);
  console.log('WETH gained: ', wethGained);

  await time.increase(86400 * 7);
  // Perform second swap, check price goes down
  await contracts.ohm.connect(ohmWhaleSigner).approve(addresses.balancerVault, amountIn);
  await contracts.balancerVault.connect(ohmWhaleSigner).swap(
    {
      poolId: poolId,
      kind: 0,
      assetIn: addresses.ohm,
      assetOut: addresses.weth,
      amount: amountIn,
      userData: '0x'
    },
    {
      sender: ohmWhale,
      fromInternalBalance: false,
      recipient: ohmWhale,
      toInternalBalance: false
    },
    0,
    '10000000000000000000000' // expiry
  );
  const secondSwapWETHAmount = (await contracts.weth.balanceOf(ohmWhale)).sub(postUserWethBalance);
  // If price has dropped, then for the same OHM the user gets more ETH
  expect(secondSwapWETHAmount).to.be.bignumber.greaterThan(wethGained);

  // Accelerate time and check ended
  await time.increase(LBP_FREQUENCY);
  expect(await ethToOhmLBPSwapper.isTimeEnded()).to.be.true;
};

export { deploy, setup, teardown, validate };
