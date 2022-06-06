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

/*

DAO Proposal #110

1. Set ethToDaiLBPSwapper to be guardian Safe addresses
2. Deploy Balancer LBP and initialise auction of ETH for DAI
3. forceSwap()
4. tighten ETH redemption spread
*/

// LBP Swapper config
const LBP_FREQUENCY = 86400 * 2; // 2 days in seconds
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(500); // 500 ETH
let poolId; // auction pool id

const fipNumber = '110';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  ///////////  1. Deploy the Balancer LBP swapper
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');

  // Oracle reports WETH price in terms of USD, so should not be inverted
  const ethToDaiLBPSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: addresses.chainlinkEthUsdOracleWrapper,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: false,
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    '50000000000000000', // small weight 5%
    '950000000000000000', // large weight 95%
    addresses.weth,
    addresses.dai,
    addresses.compoundDaiPCVDeposit, // send DAI to Compound DAI deposit, where it can then be dripped to PSM
    MIN_LBP_SIZE // minimum size of a pool which the swapper is used against
  );

  await ethToDaiLBPSwapper.deployed();
  logging && console.log('WETH to DAI swapper deployed to: ', ethToDaiLBPSwapper.address);

  // 2. Create a liquidity bootstrapping pool between WETH and DAI
  const lbpFactory = await ethers.getContractAt(
    'ILiquidityBootstrappingPoolFactory',
    addresses.balancerLBPoolFactoryNoFee
  );

  const tx: TransactionResponse = await lbpFactory.create(
    'WETH->DAI Auction Pool', // pool name
    'apWETH-DAI', // lbp token symbol
    [addresses.dai, addresses.weth], // pool contains [DAI, WETH]
    [ethers.constants.WeiPerEther.mul(5).div(100), ethers.constants.WeiPerEther.mul(95).div(100)], // initial weights 5%/95%
    ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
    ethToDaiLBPSwapper.address, // pool owner = fei protocol swapper
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const noFeeEthDaiLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;
  poolId = rawLogs[1].topics[1];

  logging && console.log('LBP Pool deployed to: ', noFeeEthDaiLBPAddress);
  logging && console.log('LBP Pool Id: ', poolId);

  // 3. Initialise the LBP swapper with the pool address
  const tx2 = await ethToDaiLBPSwapper.init(noFeeEthDaiLBPAddress);
  await tx2.wait();

  // 4. Deploy a lens to report the swapper value
  const BPTLensFactory = await ethers.getContractFactory('BPTLens');
  const ethToDaiLensDai = await BPTLensFactory.deploy(
    addresses.dai, // token reported in
    noFeeEthDaiLBPAddress, // pool address
    addresses.chainlinkDaiUsdOracleWrapper, // reportedOracle - DAI
    addresses.chainlinkEthUsdOracleWrapper, // otherOracle - WETH
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await ethToDaiLensDai.deployTransaction.wait();

  logging && console.log('BPTLens for DAI in swapper pool: ', ethToDaiLensDai.address);

  const ethToDaiLensEth = await BPTLensFactory.deploy(
    addresses.weth, // token reported in
    noFeeEthDaiLBPAddress, // pool address
    addresses.chainlinkEthUsdOracleWrapper, // reportedOracle - WETH
    addresses.chainlinkDaiUsdOracleWrapper, // otherOracle - DAI
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await ethToDaiLensEth.deployTransaction.wait();

  logging && console.log('BPTLens for WETH in swapper pool: ', ethToDaiLensEth.address);
  return {
    ethToDaiLBPSwapper,
    ethToDaiLensDai,
    ethToDaiLensEth
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // check PSM redeem fee
  const psm = contracts.ethPSM;
  expect(await psm.redeemFeeBasisPoints()).to.be.equal('75');

  // overwrite chainlink ETH/USD oracle
  const ethToDaiLBPSwapper = contracts.ethToDaiLBPSwapper;
  poolId = await ethToDaiLBPSwapper.pid();

  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '200000000000', '8'); // $2000 ETH

  // invariant checks
  expect(await ethToDaiLBPSwapper.tokenSpent()).to.be.equal(addresses.weth);
  expect(await ethToDaiLBPSwapper.tokenReceived()).to.be.equal(addresses.dai);
  expect(await ethToDaiLBPSwapper.tokenReceivingAddress()).to.be.equal(addresses.compoundDaiPCVDeposit);

  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  expect(poolTokens.tokens[0]).to.be.equal(addresses.dai);
  expect(poolTokens.tokens[1]).to.be.equal(addresses.weth);

  // LBP swapper should be empty
  expect(poolTokens.balances[0]).to.be.equal('0');
  expect(poolTokens.balances[1]).to.be.equal('0');

  // Lenses should report 0 because LBP is empty
  expect(await contracts.ethToDaiLensDai.balance()).to.be.equal('0');
  expect(await contracts.ethToDaiLensEth.balance()).to.be.equal('0');

  // Swapper should hold no tokens
  expect(await contracts.weth.balanceOf(ethToDaiLBPSwapper.address)).to.be.equal('0');
  expect(await contracts.dai.balanceOf(ethToDaiLBPSwapper.address)).to.be.equal('0');

  console.log('Starting DAI PSM dai balance [M]', (await contracts.compoundDaiPCVDeposit.balance()) / 1e24);

  console.log('DAI needed', await ethToDaiLBPSwapper.getTokensIn(ethers.constants.WeiPerEther.mul(20_000)));
  await forceEth(addresses.tribalCouncilTimelock);

  await time.increase(LBP_FREQUENCY);
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
  const ethToDaiLBPSwapper = contracts.ethToDaiLBPSwapper;
  poolId = await ethToDaiLBPSwapper.pid();

  console.log('Final DAI PSM dai balance [M]', (await contracts.compoundDaiPCVDeposit.balance()) / 1e24);

  ////////////    1. New Safe adddresses   //////////////
  expect(await contracts.pcvGuardianNew.isSafeAddress(addresses.ethToDaiLBPSwapper)).to.be.true;

  /////////////  2. WETH LBP  ////////////////
  await validateLBPSetup(contracts, addresses, poolId);

  /////////////  3. PSM Redeem  ////////////////

  // check PSM redeem fee
  const psm = contracts.ethPSM;
  expect(await psm.redeemFeeBasisPoints()).to.be.equal('60');

  // Validate PSM_ADMIN_ROLE is under ROLE_ADMIN and that TribalCouncilTimelock has the role
  expect(await core.hasRole(ethers.utils.id('PSM_ADMIN_ROLE'), addresses.tribalCouncilTimelock)).to.be.true;
  expect(await core.getRoleAdmin(ethers.utils.id('PSM_ADMIN_ROLE'))).to.be.equal(ethers.utils.id('ROLE_ADMIN'));
};

const validateLBPSetup = async (contracts: NamedContracts, addresses: NamedAddresses, poolId: string) => {
  const ethToDaiLBPSwapper = contracts.ethToDaiLBPSwapper;

  expect(await ethToDaiLBPSwapper.doInvert()).to.be.equal(false);
  expect(await ethToDaiLBPSwapper.isTimeStarted()).to.be.true;
  expect(await ethToDaiLBPSwapper.tokenSpent()).to.equal(addresses.weth);
  expect(await ethToDaiLBPSwapper.tokenReceived()).to.equal(addresses.dai);

  // tokenSpent = WETH
  // tokenReceived = DAI
  // On BalancerVault, token[0] = WETH, token[1] = DAI
  // Therefore, on LBPSwapper, assets[0] = WETH, assets[1] = DAI

  // 2.1 Check oracle price
  const price = (await ethToDaiLBPSwapper.readOracle())[0]; // DAI price in units of WETH
  console.log('price: ', price);
  expect(price).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(1600)); // 1600e18
  expect(price).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(2200)); // 2200e18

  // 2.2 Check relative price in pool

  // Putting in 20,000 tokens of WETH, getting an amount of DAI back
  const response = await ethToDaiLBPSwapper.getTokensIn(20000); // input is spent token balance, 100,000 WETH tokens
  const amounts = response[1];

  // DAI/WETH price * DAI amount * 5% ~= amount
  expectApprox(price.mul(20000).mul(5).div(ethers.constants.WeiPerEther).div(100), amounts[1]); // DAI
  expect(amounts[0]).to.be.bignumber.at.least(toBN(2_000_000)); // Make sure orcacle inversion is correct (i.e. not inverted)

  expect(amounts[1]).to.be.bignumber.equal(ethers.BigNumber.from(20000)); // WETH

  // 2.3 Check pool info
  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  // there should be 2.1M DAI in the pool
  expect(poolTokens.tokens[0]).to.be.equal(contracts.dai.address); // this is DAI
  expect(poolTokens.balances[0]).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(2_000_000));
  expect(poolTokens.balances[0]).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(2_200_000));
  // there should be 20k WETH in the pool
  expect(poolTokens.tokens[1]).to.be.equal(contracts.weth.address); // this is WETH
  expect(poolTokens.balances[1]).to.be.equal('20000000000000000000000');

  // Validate that a swap can occur
  const daiWhale = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643';
  const daiWhaleSigner = await getImpersonatedSigner(daiWhale);
  await forceEth(daiWhale);

  const initialUserEthBalance = await contracts.weth.balanceOf(daiWhale);
  const initialUserDaiBalance = await contracts.dai.balanceOf(daiWhale);

  const amountIn = ethers.constants.WeiPerEther.mul(10_000);
  await contracts.dai.connect(daiWhaleSigner).approve(addresses.balancerVault, amountIn);
  await contracts.balancerVault.connect(daiWhaleSigner).swap(
    {
      poolId: poolId,
      kind: 0,
      assetIn: addresses.dai,
      assetOut: addresses.weth,
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

  const postUserEthBalance = await contracts.weth.balanceOf(daiWhale);
  const postUserDaiBalance = await contracts.dai.balanceOf(daiWhale);

  const daiSpent = initialUserDaiBalance.sub(postUserDaiBalance);
  expect(daiSpent).to.be.bignumber.equal(amountIn);

  const ethGained = postUserEthBalance.sub(initialUserEthBalance);
  expect(ethGained).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(4));
  expect(ethGained).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(6));

  // Put in 10k DAI, got out ~5 WETH
  // Implies price of $2000 per WETH
  console.log('DAI spent: ', daiSpent);
  console.log('WETH gained: ', ethGained);

  // Accelerate time and check ended
  await time.increase(LBP_FREQUENCY);
  expect(await ethToDaiLBPSwapper.isTimeEnded()).to.be.true;
};

export { deploy, setup, teardown, validate };
