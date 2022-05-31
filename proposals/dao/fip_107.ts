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
  ////////////// 1. Create and deploy gOHM USD oracle
  const GOhmEthOracleFactory = await ethers.getContractFactory('GOhmEthOracle');
  const gOHMEthOracle = await GOhmEthOracleFactory.deploy(addresses.core, CHAINLINK_OHM_V2_ETH_ORACLE);
  await gOHMEthOracle.deployed();

  logging && console.log(`Deployed gOHM Eth Oracle at ${gOHMEthOracle.address}`);

  // Create the gOHM USD oracle
  const CompositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const gOhmUSDOracle = await CompositeOracleFactory.deploy(
    addresses.core,
    gOHMEthOracle.address,
    addresses.chainlinkEthUsdOracleWrapper
  );

  logging && console.log('Deployed gOHM oracle to: ', gOhmUSDOracle.address);

  ///////////  2. Deploy the Balancer LBP swapper
  // // Amounts:
  // ETH: 5410000000000000000000 (95%), 5410 ETH, ~$10,500,000 at 1 ETH = $1941
  // OHM:  200000000000000000000 (5%), 175 gOHM, ~$525,000 at 1 OHM = $2990 overfunding by 15% and transferring $600k
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');

  // tokenSpent = WETH, tokenReceived = gOHM
  // Oracle reports gOHM / ETH, therefore is reporting in tokenReceived terms.
  // WETH = 18 decimals
  // gOHM = 18 decimals
  // tokenSpent = WETH
  // tokenReceived = gOHM

  const ethTogOhmLBPSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: gOHMEthOracle.address, // oracle that reports tokenSpent price
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    '50000000000000000', // small weight 5%
    '950000000000000000', // large weight 95%
    addresses.weth, // tokenSpent
    addresses.gohm, // tokenReceived
    addresses.tribalCouncilTimelock, // Send OHM to the TribalCouncil Timelock once LBP has completed
    MIN_LBP_SIZE // minimum size of a pool which the swapper is used against
  );

  await ethTogOhmLBPSwapper.deployed();
  logging && console.log('ETH to gOHM swapper deployed to: ', ethTogOhmLBPSwapper.address);

  // 2. Create a liquidity bootstrapping pool between ETH and OHM
  const lbpFactory = await ethers.getContractAt(
    'ILiquidityBootstrappingPoolFactory',
    addresses.balancerLBPoolFactoryNoFee
  );

  const tx: TransactionResponse = await lbpFactory.create(
    'ETH->gOHM Auction Pool', // pool name
    'apETH-gOHM', // lbp token symbol
    [addresses.gohm, addresses.weth], // pool contains [WETH, gOHM]
    [ethers.constants.WeiPerEther.mul(5).div(100), ethers.constants.WeiPerEther.mul(95).div(100)], // initial weights 5%/95%
    ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
    ethTogOhmLBPSwapper.address, // pool owner = fei protocol swapper
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const noFeeEthgOhmLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;
  poolId = rawLogs[1].topics[1];

  logging && console.log('LBP Pool deployed to: ', noFeeEthgOhmLBPAddress);
  logging && console.log('LBP Pool Id: ', poolId);

  // 3. Initialise the LBP swapper with the pool address
  const tx2 = await ethTogOhmLBPSwapper.init(noFeeEthgOhmLBPAddress);
  await tx2.wait();

  const ethToGOhmLBPPool = await ethers.getContractAt('IWeightedPool', noFeeEthgOhmLBPAddress);

  // 4. Deploy a lens to report the swapper value
  const BPTLensFactory = await ethers.getContractFactory('BPTLens');
  const gOhmToETHLensgOHM = await BPTLensFactory.deploy(
    addresses.gohm, // token reported in
    noFeeEthgOhmLBPAddress, // pool address
    gOhmUSDOracle.address, // reportedOracle - gOHM
    addresses.chainlinkEthUsdOracleWrapper, // otherOracle - ETH
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await gOhmToETHLensgOHM.deployTransaction.wait();

  logging && console.log('BPTLens for OHM in swapper pool: ', gOhmToETHLensgOHM.address);

  const gOhmToETHLensETH = await BPTLensFactory.deploy(
    addresses.weth, // token reported in
    noFeeEthgOhmLBPAddress, // pool address
    addresses.chainlinkEthUsdOracleWrapper, // reportedOracle - ETH
    gOhmUSDOracle.address, // otherOracle - gOHM
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await gOhmToETHLensETH.deployTransaction.wait();

  logging && console.log('BPTLens for OHM in swapper pool: ', gOhmToETHLensETH.address);
  return {
    ethTogOhmLBPSwapper,
    gOhmToETHLensgOHM,
    gOhmToETHLensETH,
    gOhmUSDOracle,
    gOHMEthOracle,
    ethToGOhmLBPPool
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // overwrite chainlink ETH/USD oracle
  const ethTogOhmLBPSwapper = contracts.ethTogOhmLBPSwapper;

  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '250000000000', '8');

  // invariant checks
  expect(await ethTogOhmLBPSwapper.tokenSpent()).to.be.equal(addresses.weth);
  expect(await ethTogOhmLBPSwapper.tokenReceived()).to.be.equal(addresses.gohm);
  expect(await ethTogOhmLBPSwapper.tokenReceivingAddress()).to.be.equal(addresses.tribalCouncilTimelock);
  expect(await ethTogOhmLBPSwapper.duration()).to.be.equal(LBP_FREQUENCY);

  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  expect(poolTokens.tokens[0]).to.be.equal(addresses.gohm); // poolToken[0] is gOHM
  expect(poolTokens.tokens[1]).to.be.equal(addresses.weth); // poolToken[1] is WETH

  // LBP swapper should be empty
  expect(poolTokens.balances[0]).to.be.equal('0');
  expect(poolTokens.balances[1]).to.be.equal('0');

  // Lenses should report 0 because LBP is empty
  expect(await contracts.gOhmToETHLensgOHM.balance()).to.be.equal('0');
  expect(await contracts.gOhmToETHLensETH.balance()).to.be.equal('0');

  // Swapper should hold no tokens
  expect(await contracts.weth.balanceOf(ethTogOhmLBPSwapper.address)).to.be.equal('0');
  expect(await contracts.gohm.balanceOf(ethTogOhmLBPSwapper.address)).to.be.equal('0');
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  ////////////    1. New Safe adddresses   //////////////
  expect(await contracts.pcvGuardianNew.isSafeAddress(addresses.ethTogOhmLBPSwapper)).to.be.true;

  ////////////    2. gOHM oracle price is valid   //////////////
  const gOhmUSDPrice = (await contracts.gOhmUSDOracle.read())[0];
  expect(toBN(gOhmUSDPrice.value)).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(2_500)); // $2500
  expect(toBN(gOhmUSDPrice.value)).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(3_400)); // $3400

  /////////////  3.    OHM LBP  ////////////////
  await validateLBPSetup(contracts, addresses, poolId);
};

const validateLBPSetup = async (contracts: NamedContracts, addresses: NamedAddresses, poolId: string) => {
  const ethTogOhmLBPSwapper = contracts.ethTogOhmLBPSwapper;
  const ethToGOhmLBPPool = contracts.ethToGOhmLBPPool;

  const retrievedPoolId = await ethToGOhmLBPPool.getPoolId();
  expect(retrievedPoolId).to.equal(poolId);

  expect(await ethTogOhmLBPSwapper.isTimeStarted()).to.be.true;
  expect(await ethTogOhmLBPSwapper.tokenSpent()).to.equal(addresses.weth);
  expect(await ethTogOhmLBPSwapper.tokenReceived()).to.equal(addresses.gohm);
  expect(await ethToGOhmLBPPool.getSwapEnabled()).to.equal(true);
  // tokenSpent = WETH
  // tokenReceived = gOHM

  // 2.1 Check oracle price - understand this part
  const price = (await ethTogOhmLBPSwapper.readOracle())[0]; // Eth price in terms of gOHM
  // gOHM = $2990, ETH = $1941
  // Expect: 1941 / 2990 = 0.65
  expect(price).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(600).div(1e3)); // 0.6
  expect(price).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(700).div(1e3)); // 0.7

  // 2.2 Check relative price in pool
  // Putting in 3 ETH, getting an amount of OHM back
  const response = await ethTogOhmLBPSwapper.getTokensIn(ethers.constants.WeiPerEther.mul(3)); // input is spent token balance, 3 ETH
  const amounts = response[1];
  expect(amounts[1]).to.be.bignumber.equal(ethers.BigNumber.from(ethers.constants.WeiPerEther.mul(3))); // ETH

  // gOHM/ETH price * gOHM amount * 5% ~= amount
  expectApprox(
    price.mul(ethers.constants.WeiPerEther.mul(3)).mul(5).div(ethers.constants.WeiPerEther).div(100),
    amounts[0]
  ); // gOHM
  expect(amounts[0]).to.be.bignumber.at.least(toBN(1000)); // Make sure oracle inversion is correct (i.e. not inverted)

  // 2.3 Check pool weights
  const weights = await ethToGOhmLBPPool.getNormalizedWeights();
  expectApprox(weights[0], ethers.constants.WeiPerEther.mul(5).div(100)); // 5% gOHM
  expectApprox(weights[1], ethers.constants.WeiPerEther.mul(95).div(100)); // 95% ETH

  // 2.4 Check pool info
  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  // poolTokens[0] is gOHM
  // poolTokens[1] is WETH

  // there should be 200 gOHM in the pool. It has 18 decimals
  expect(poolTokens.tokens[0]).to.be.equal(contracts.gohm.address); // this is gOHM
  expect(poolTokens.balances[0]).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(180));
  expect(poolTokens.balances[0]).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(220));

  // there should be 5410 ETH in the pool
  expect(poolTokens.tokens[1]).to.be.equal(contracts.weth.address); // this is WETH
  expect(poolTokens.balances[1]).to.be.equal('5410000000000000000000');

  // Pool balances Maths:
  // Total value of pool = (200 gOHM * $2990) + (5410 ETH * $1941) = $11.1M
  // gOHM share = 5%
  // ETH share = 95%
  // Expected gOHM amount = $11.1M * 0.05 = ~$555k
  // Expected ETH amount = $11.1M * 0.95 = ~$10.55M -> ~ ($10,550k / 1941) 5435 eth

  // Validate that a swap can occur
  const gOhmWhale = '0x245cc372C84B3645Bf0Ffe6538620B04a217988B'; // Olympus DAO funds
  const gOhmWhaleSigner = await getImpersonatedSigner(gOhmWhale);
  await forceEth(gOhmWhale);

  // Make an ETH buy. User sends in OHM, to purchase ETH. See what the price reported for OHM is. Should be higher than oracle reported price
  const initialUserWethBalance = await contracts.weth.balanceOf(gOhmWhale);
  const initialUsergOhmBalance = await contracts.gohm.balanceOf(gOhmWhale);

  // 5 gOHM buy, ~$15k, so expect ~7 eth out
  const amountIn = ethers.constants.WeiPerEther.mul(5); // 5 gOHM buy, ~$16k purchase
  await contracts.gohm.connect(gOhmWhaleSigner).approve(addresses.balancerVault, amountIn);
  await contracts.balancerVault.connect(gOhmWhaleSigner).swap(
    {
      poolId: poolId,
      kind: 0,
      assetIn: addresses.gohm,
      assetOut: addresses.weth,
      amount: amountIn,
      userData: '0x'
    },
    {
      sender: gOhmWhale,
      fromInternalBalance: false,
      recipient: gOhmWhale,
      toInternalBalance: false
    },
    0,
    '10000000000000000000000'
  );

  const postUserWethBalance = await contracts.weth.balanceOf(gOhmWhale);
  const postUsergOhmBalance = await contracts.gohm.balanceOf(gOhmWhale);

  // Spent OHM, so starting OHM balance will be less than final balance
  const gOhmSpent = initialUsergOhmBalance.sub(postUsergOhmBalance);
  expect(gOhmSpent).to.be.bignumber.equal(amountIn);

  // Gained WETH, so final WETH balance will be greater than initial WETH balance
  const wethGained = postUserWethBalance.sub(initialUserWethBalance);
  expect(wethGained).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(5));
  expect(wethGained).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(15));

  // Put in ~$15k OHM, got out 7.7 ETH
  // Implied price of $2976 gOHM, compared to a true price of $2953 on Uniswap V3
  console.log('gOHM spent: ', gOhmSpent);
  console.log('WETH gained: ', wethGained);

  await time.increase(86400 * 7);
  // Perform second swap, check price goes down
  await contracts.gohm.connect(gOhmWhaleSigner).approve(addresses.balancerVault, amountIn);
  await contracts.balancerVault.connect(gOhmWhaleSigner).swap(
    {
      poolId: poolId,
      kind: 0,
      assetIn: addresses.gohm,
      assetOut: addresses.weth,
      amount: amountIn,
      userData: '0x'
    },
    {
      sender: gOhmWhale,
      fromInternalBalance: false,
      recipient: gOhmWhale,
      toInternalBalance: false
    },
    0,
    '10000000000000000000000' // expiry
  );
  const secondSwapWETHAmount = (await contracts.weth.balanceOf(gOhmWhale)).sub(postUserWethBalance);
  // If price has dropped, then for the same OHM the user gets more ETH
  expect(secondSwapWETHAmount).to.be.bignumber.greaterThan(wethGained);

  // Accelerate time and check ended
  await time.increase(LBP_FREQUENCY);
  expect(await ethTogOhmLBPSwapper.isTimeEnded()).to.be.true;
};

export { deploy, setup, teardown, validate };
