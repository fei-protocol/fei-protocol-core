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

DAO Proposal #105

1. Set uniswapPCVDeposit and dpiToDaiLBPSwapper to be guardian Safe addresses
2. Deploy Balancer LBP and initialise auction of DPI for DAI
3. Fix NopeDAO voting period
4. Transfer CREAM to TribalCouncil multisig, where it will then be sold to ETH
5. Withdraw 15,000 WETH from DAO timelock to the aaveETHPCVDeposit
6. Fund TC with 10 eth
7. Invert oracle price on LBP swapper and forceSwap()
*/

// LBP Swapper config
const LBP_FREQUENCY = 86400 * 14; // 2 weeks in seconds
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(10_000); // 10k
let poolId; // auction pool id

const fipNumber = '105';
const skimThreshold = ethers.constants.WeiPerEther.mul(20_000_000);

let initialAavePCVBalance: BigNumber;
const aaveWETHTransferAmount = '14999999999999999992057'; // almost 15,000 WETH

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  /////////  1. Deploy a Fei Skimmer for the DAI PSM
  const daiPSMFeiSkimmerFactory = await ethers.getContractFactory('FeiSkimmer');
  const daiFixedPricePSMFeiSkimmer = await daiPSMFeiSkimmerFactory.deploy(
    addresses.core,
    addresses.daiFixedPricePSM,
    skimThreshold
  );
  await daiFixedPricePSMFeiSkimmer.deployed();
  logging && console.log('DAI PSM Fei Skimmer deployed at', daiFixedPricePSMFeiSkimmer.address);

  ///////////  2. Deploy the Balancer LBP swapper
  // // Amounts:
  // DPI: 37888449801955370645659 (95%), 37k DPI, $3,587,445
  // DAI: 187947000000000000000000 (5%), 187k DAI, $179,372.05, overfunding by ~$9k and transferring $187,947
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');

  // Oracle reports DPI price in terms of USD, so should not be inverted
  // Specifically reports: 101258471470000000000, which is $101. As expected
  const dpiToDaiSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: addresses.chainlinkDpiUsdOracleWrapper,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    '50000000000000000', // small weight 5%
    '950000000000000000', // large weight 95%
    addresses.dpi,
    addresses.dai,
    addresses.compoundDaiPCVDeposit, // send DAI to Compound DAI deposit, where it can then be dripped to PSM
    MIN_LBP_SIZE // minimum size of a pool which the swapper is used against
  );

  await dpiToDaiSwapper.deployed();
  logging && console.log('DPI to DAI swapper deployed to: ', dpiToDaiSwapper.address);

  // 2. Create a liquidity bootstrapping pool between DPI and DAI
  const lbpFactory = await ethers.getContractAt(
    'ILiquidityBootstrappingPoolFactory',
    addresses.balancerLBPoolFactoryNoFee
  );

  const tx: TransactionResponse = await lbpFactory.create(
    'DPI->DAI Auction Pool', // pool name
    'apDPI-DAI', // lbp token symbol
    [addresses.dpi, addresses.dai], // pool contains [DPI, DAI]
    [ethers.constants.WeiPerEther.mul(95).div(100), ethers.constants.WeiPerEther.mul(5).div(100)], // initial weights 5%/95%
    ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
    dpiToDaiSwapper.address, // pool owner = fei protocol swapper
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const noFeeDpiDaiLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;
  poolId = rawLogs[1].topics[1];

  logging && console.log('LBP Pool deployed to: ', noFeeDpiDaiLBPAddress);
  logging && console.log('LBP Pool Id: ', poolId);

  // 3. Initialise the LBP swapper with the pool address
  const tx2 = await dpiToDaiSwapper.init(noFeeDpiDaiLBPAddress);
  await tx2.wait();

  // 4. Deploy a lens to report the swapper value
  const BPTLensFactory = await ethers.getContractFactory('BPTLens');
  const dpiToDaiLensDai = await BPTLensFactory.deploy(
    addresses.dai, // token reported in
    noFeeDpiDaiLBPAddress, // pool address
    addresses.chainlinkDaiUsdOracleWrapper, // reportedOracle - DAI
    addresses.chainlinkDpiUsdOracleWrapper, // otherOracle - DPI
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await dpiToDaiLensDai.deployTransaction.wait();

  logging && console.log('BPTLens for DAI in swapper pool: ', dpiToDaiLensDai.address);

  const dpiToDaiLensDpi = await BPTLensFactory.deploy(
    addresses.dpi, // token reported in
    noFeeDpiDaiLBPAddress, // pool address
    addresses.chainlinkDpiUsdOracleWrapper, // reportedOracle - DPI
    addresses.chainlinkDaiUsdOracleWrapper, // otherOracle - DAI
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await dpiToDaiLensDpi.deployTransaction.wait();

  logging && console.log('BPTLens for DPI in swapper pool: ', dpiToDaiLensDpi.address);
  return {
    daiFixedPricePSMFeiSkimmer,
    dpiToDaiSwapper,
    dpiToDaiLensDai,
    dpiToDaiLensDpi
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  poolId = '0xd10386804959a121a8a487e49f45aa9f5a2eb2a00002000000000000000001f1';
  // overwrite chainlink ETH/USD oracle
  const dpiToDaiLBPSwapper = contracts.dpiToDaiLBPSwapper;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '250000000000', '8');

  // invariant checks
  expect(await dpiToDaiLBPSwapper.tokenSpent()).to.be.equal(addresses.dpi);
  expect(await dpiToDaiLBPSwapper.tokenReceived()).to.be.equal(addresses.dai);
  expect(await dpiToDaiLBPSwapper.tokenReceivingAddress()).to.be.equal(addresses.compoundDaiPCVDeposit);

  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  expect(poolTokens.tokens[0]).to.be.equal(addresses.dpi);
  expect(poolTokens.tokens[1]).to.be.equal(addresses.dai);

  // LBP swapper should be empty
  expect(poolTokens.balances[0]).to.be.equal('0');
  expect(poolTokens.balances[1]).to.be.equal('0');

  // Lenses should report 0 because LBP is empty
  expect(await contracts.dpiToDaiLensDai.balance()).to.be.equal('0');
  expect(await contracts.dpiToDaiLensDpi.balance()).to.be.equal('0');

  // Swapper should hold no tokens
  expect(await contracts.dpi.balanceOf(dpiToDaiLBPSwapper.address)).to.be.equal('0');
  expect(await contracts.dai.balanceOf(dpiToDaiLBPSwapper.address)).to.be.equal('0');

  console.log('Starting DAI PSM dai balance [M]', (await contracts.compoundDaiPCVDeposit.balance()) / 1e24);

  await forceEth(addresses.tribalCouncilTimelock);

  initialAavePCVBalance = await contracts.aaveEthPCVDepositWrapper.balance();
  logging && console.log('Initial Aave Eth PCV Balance: ', initialAavePCVBalance.toString());
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
  poolId = '0xd10386804959a121a8a487e49f45aa9f5a2eb2a00002000000000000000001f1';
  console.log('Final DAI PSM dai balance [M]', (await contracts.compoundDaiPCVDeposit.balance()) / 1e24);

  ////////////    1. New Safe adddresses   //////////////
  expect(await contracts.pcvGuardianNew.isSafeAddress(addresses.uniswapPCVDeposit)).to.be.true;
  expect(await contracts.pcvGuardianNew.isSafeAddress(addresses.dpiToDaiLBPSwapper)).to.be.true;

  /////////////  2.    DPI LBP  ////////////////
  await validateLBPSetup(contracts, addresses, poolId);

  // Validate SWAP_ADMIN_ROLE is under ROLE_ADMIN and that TribalCouncilTimelock has the role
  expect(await core.hasRole(ethers.utils.id('SWAP_ADMIN_ROLE'), addresses.tribalCouncilTimelock)).to.be.true;
  expect(await core.getRoleAdmin(ethers.utils.id('SWAP_ADMIN_ROLE'))).to.be.equal(ethers.utils.id('ROLE_ADMIN'));

  ////////  3. Nope DAO Voting Period fix  /////////////
  expect(await contracts.nopeDAO.votingPeriod()).to.be.equal(26585);

  /////// 4. CREAM transferred to TribalCouncil multisig ////////
  const creamAmount = '31780370000000000000000';
  expect(await contracts.cream.balanceOf(addresses.tribalCouncilSafe)).to.be.equal(toBN(creamAmount));

  ///////  5. Fund TribalCouncil with 10 Eth //////////
  const ethersSigner = (await ethers.getSigners())[0];
  expect(await ethersSigner.provider.getBalance(addresses.tribalCouncilSafe)).to.be.equal(
    ethers.utils.parseEther('10')
  );

  /////// 6. Transfer WETH to the aaveETHPCVDeposit //////
  const finalAavePCVBalance = await contracts.aaveEthPCVDepositWrapper.balance();
  expect(finalAavePCVBalance).to.be.bignumber.at.least(initialAavePCVBalance.add(aaveWETHTransferAmount));
  logging && console.log('Final Aave Eth PCV Balance: ', finalAavePCVBalance.toString());
};

const validateLBPSetup = async (contracts: NamedContracts, addresses: NamedAddresses, poolId: string) => {
  const dpiToDaiLBPSwapper = contracts.dpiToDaiLBPSwapper;
  const dpiToDaiLBPPool = contracts.dpiToDaiLBPPool;

  const retrievedPoolId = await dpiToDaiLBPPool.getPoolId();
  expect(retrievedPoolId).to.equal(poolId);

  // expect(await dpiToDaiLBPSwapper.doInvert()).to.be.equal(true);
  expect(await dpiToDaiLBPSwapper.isTimeStarted()).to.be.true;
  expect(await dpiToDaiLBPSwapper.tokenSpent()).to.equal(addresses.dpi);
  expect(await dpiToDaiLBPSwapper.tokenReceived()).to.equal(addresses.dai);
  expect(await dpiToDaiLBPPool.getSwapEnabled()).to.equal(true);
  // tokenSpent = DPI
  // tokenReceived = DAI
  // On BalancerVault, token[0] = DPI, token[1] = DAI
  // Therefore, on LBPSwapper, assets[0] = DPI, assets[1] = DAI

  // 2.1 Check oracle price
  const price = (await dpiToDaiLBPSwapper.readOracle())[0]; // DAI price in units of DPI
  console.log('price: ', price);
  expect(price).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(90)); // 90e18
  expect(price).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(100)); // 100e18

  // 2.2 Check relative price in pool
  // Putting in 100,000 tokens of DPI, getting an amount of DAI back
  const response = await dpiToDaiLBPSwapper.getTokensIn(100000); // input is spent token balance, 100,000 DPI tokens
  const amounts = response[1];
  expect(amounts[0]).to.be.bignumber.equal(ethers.BigNumber.from(100000)); // DPI

  // DAI/DPI price * DAI amount * 5% ~= amount
  expectApprox(price.mul(100000).mul(5).div(ethers.constants.WeiPerEther).div(100), amounts[1]); // DAI
  expect(amounts[1]).to.be.bignumber.at.least(toBN(1000)); // Make sure orcacle inversion is correct (i.e. not inverted)

  // 2.3 Check pool weights
  const weights = await dpiToDaiLBPPool.getNormalizedWeights();
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
  expect(await dpiToDaiLBPSwapper.isTimeEnded()).to.be.true;
};

export { deploy, setup, teardown, validate };
