import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  PcvStats,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';
import { getImpersonatedSigner, overwriteChainlinkAggregator } from '@test/helpers';
import { TransactionResponse } from '@ethersproject/providers';
import { forceEth } from '@test/integration/setup/utils';

const fipNumber = '121a';
const e18 = ethers.utils.parseEther;

let pcvStatsBefore: PcvStats;
let tribeInDaoTreasuryBefore: BigNumber;
let noFeeLusdDaiLBPAddress: string;
let poolId: string;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy the LUSD->DAI Balancer LBP swapper
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');
  const lusdToDaiSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: addresses.chainlinkLUSDOracleWrapper,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: false,
      _decimalsNormalizer: 0
    },
    24 * 3600, // 1 day
    '20000000000000000', // small weight 2%
    '980000000000000000', // large weight 98%
    addresses.lusd,
    addresses.dai,
    addresses.daiHoldingPCVDeposit, // send DAI to holding deposit, where it can then be dripped to PSM
    ethers.utils.parseEther('100000') // minimum size of a pool which the swapper is used against
  );

  await lusdToDaiSwapper.deployed();
  logging && console.log('LUSD to DAI swapper deployed to:', lusdToDaiSwapper.address);

  // Create a liquidity bootstrapping pool between LUSD and DAI
  const lbpFactory = await ethers.getContractAt(
    'ILiquidityBootstrappingPoolFactory',
    addresses.balancerLBPoolFactoryNoFee
  );

  const tx: TransactionResponse = await lbpFactory.create(
    'LUSD->DAI Auction Pool', // pool name
    'apLUSD-DAI', // lbp token symbol
    [addresses.lusd, addresses.dai], // pool contains [LUSD, DAI]
    [ethers.constants.WeiPerEther.mul(98).div(100), ethers.constants.WeiPerEther.mul(2).div(100)], // initial weights 5%/95%
    ethers.constants.WeiPerEther.mul(5).div(10_000), // 0.05% swap fees
    lusdToDaiSwapper.address, // pool owner = fei protocol swapper
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  noFeeLusdDaiLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;
  poolId = rawLogs[1].topics[1];

  logging && console.log('LBP Pool deployed to: ', noFeeLusdDaiLBPAddress);
  logging && console.log('LBP Pool Id: ', poolId);

  // Initialise the LBP swapper with the pool address
  const tx2 = await lusdToDaiSwapper.init(noFeeLusdDaiLBPAddress);
  await tx2.wait();

  // Deploy a lens to report the swapper value
  const BPTLensFactory = await ethers.getContractFactory('BPTLens');
  const lusdToDaiLensDai = await BPTLensFactory.deploy(
    addresses.dai, // token reported in
    noFeeLusdDaiLBPAddress, // pool address
    addresses.chainlinkDaiUsdOracleWrapper, // reportedOracle - DAI
    addresses.chainlinkLUSDOracleWrapper, // otherOracle - LUSD
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await lusdToDaiLensDai.deployTransaction.wait();

  logging && console.log('BPTLens for DAI in swapper pool: ', lusdToDaiLensDai.address);

  const lusdToDaiLensLusd = await BPTLensFactory.deploy(
    addresses.lusd, // token reported in
    noFeeLusdDaiLBPAddress, // pool address
    addresses.chainlinkLUSDOracleWrapper, // reportedOracle - LUSD
    addresses.chainlinkDaiUsdOracleWrapper, // otherOracle - DAI
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await lusdToDaiLensLusd.deployTransaction.wait();

  logging && console.log('BPTLens for LUSD in swapper pool: ', lusdToDaiLensLusd.address);

  // Deploy gOHM otc escrow
  const ohmEscrowUnwind = await (
    await ethers.getContractFactory('OtcEscrow')
  ).deploy(
    addresses.olympusMultisig, // beneficiary = Olympus multisig
    addresses.core, // recipient = Tribe DAO
    addresses.tribe, // receivedToken
    addresses.gOHM, // sentToken
    '3753510000000000000000000', // receivedAmount
    '577180000000000000000' // sentAmount
  );

  logging && console.log('ohmEscrowUnwind:', ohmEscrowUnwind.address);

  // Deploy the FEI Withdrawal Guard
  const MaxFeiWithdrawalGuard = await ethers.getContractFactory('MaxFeiWithdrawalGuard');
  const maxFeiWithdrawalGuard = await MaxFeiWithdrawalGuard.deploy(
    addresses.core,
    [
      // deposits
      addresses.aaveFeiPCVDeposit,
      addresses.compoundFeiPCVDeposit
    ],
    [
      // destinations
      addresses.daiFixedPricePSM,
      addresses.daiFixedPricePSM
    ],
    [
      // liquiditySources
      addresses.aFei,
      addresses.cFei
    ]
  );
  await maxFeiWithdrawalGuard.deployTransaction.wait();

  logging && console.log('maxFeiWithdrawalGuard:', maxFeiWithdrawalGuard.address);

  return {
    maxFeiWithdrawalGuard,
    lusdToDaiSwapper,
    lusdToDaiLensDai,
    lusdToDaiLensLusd,
    ohmEscrowUnwind
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();
  tribeInDaoTreasuryBefore = await contracts.tribe.balanceOf(addresses.core);

  console.log('compound dai balance before', (await contracts.compoundDaiPCVDeposit.balance()) / 1e24, '(millions)');
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  poolId = '0x8485b36623632ffa5e486008df4d0b6d363defdb00020000000000000000034a'; // LUSD>DAI pool

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

  // check amount of TRIBE returned in DAO treasury from buybacks pool
  const tribeInDaoTreasuryAfter = await contracts.tribe.balanceOf(addresses.core);
  const tribeReturnedToDaoTreasury = tribeInDaoTreasuryAfter.sub(tribeInDaoTreasuryBefore);
  expect(tribeReturnedToDaoTreasury).to.be.at.least(e18('2100000')); // 2.1M TRIBE

  // Check lenses & balances
  // LUSD -> DAI pool lenses
  expect((await contracts.lusdToDaiLensDai.resistantBalanceAndFei())[0]).to.be.at.least(e18('350000')); // 350k DAI
  expect((await contracts.lusdToDaiLensDai.resistantBalanceAndFei())[1]).to.be.equal('0'); // 0 FEI
  expect((await contracts.lusdToDaiLensLusd.resistantBalanceAndFei())[0]).to.be.at.least(e18('18500000')); // 18.5M LUSD
  expect((await contracts.lusdToDaiLensLusd.resistantBalanceAndFei())[1]).to.be.equal('0'); // 0 FEI
  // LUSD -> DAI pool balances
  const lusdPoolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  expect(lusdPoolTokens.balances[0]).to.be.at.least(e18('18500000')); // 18.5M LUSD
  expect(lusdPoolTokens.balances[1]).to.be.at.least(e18('350000')); // 350k DAI
  // WETH -> DAI pool balances
  const wethPoolTokens = await contracts.balancerVault.getPoolTokens(
    '0x34809aedf93066b49f638562c42a9751edb36df5000200000000000000000223'
  );
  expect(wethPoolTokens.balances[0]).to.be.at.least(e18('1800000')); // 1.8M DAI
  expect(wethPoolTokens.balances[1]).to.be.at.least(e18('22000')); // 22k WETH
  // buybacks protocol-owned fei
  expect((await contracts.feiBuybackLensNoFee.resistantBalanceAndFei())[0]).to.be.at.most(e18('1')); // <1 FEI
  expect((await contracts.feiBuybackLensNoFee.resistantBalanceAndFei())[1]).to.be.at.most(e18('1')); // <1 FEI
  // moved funds on various pcv deposits
  expect(await contracts.compoundDaiPCVDeposit.balance()).to.be.at.most(e18('10')); // <10 DAI left in Compound
  expect(await contracts.lusdHoldingPCVDeposit.balance()).to.be.equal('0');
  expect(await contracts.wethHoldingPCVDeposit.balance()).to.be.equal('0');
  expect(await contracts.daiHoldingPCVDeposit.balance()).to.be.at.least(e18('57500000')); // > 57.5M DAI

  expect(await contracts.lusdToDaiSwapper.duration()).to.be.equal('172800'); // 2 days

  // Validate that a swap can occur
  const daiWhale = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643';
  const daiWhaleSigner = await getImpersonatedSigner(daiWhale);
  await forceEth(daiWhale);

  const initialUserLusdBalance = await contracts.lusd.balanceOf(daiWhale);
  const initialUserDaiBalance = await contracts.dai.balanceOf(daiWhale);

  const amountIn = ethers.constants.WeiPerEther.mul(10_000);
  await contracts.dai.connect(daiWhaleSigner).approve(addresses.balancerVault, amountIn);
  await contracts.balancerVault.connect(daiWhaleSigner).swap(
    {
      poolId: poolId,
      kind: 0,
      assetIn: addresses.dai,
      assetOut: addresses.lusd,
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
    '10000000000000000000000' // deadline
  );

  const postUserLusdBalance = await contracts.lusd.balanceOf(daiWhale);
  const postUserDaiBalance = await contracts.dai.balanceOf(daiWhale);

  const daiSpent = initialUserDaiBalance.sub(postUserDaiBalance);
  expect(daiSpent).to.be.bignumber.equal(amountIn);

  const lusdGained = postUserLusdBalance.sub(initialUserLusdBalance);
  expect(lusdGained).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(9_500));
  expect(lusdGained).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(11_000));

  // Put in 10k DAI, got out ~10k LUSD
  console.log('DAI spent: ', daiSpent / 1e18);
  console.log('LUSD gained: ', lusdGained / 1e18);

  // Execute OTC (impersonate Olympus multisig) to check it functions properly
  const otcTribeAmount = '3753510000000000000000000';
  const olympusSigner = await getImpersonatedSigner(addresses.olympusMultisig);
  await contracts.tribe.connect(olympusSigner).approve(addresses.ohmEscrowUnwind, otcTribeAmount);
  await contracts.ohmEscrowUnwind.connect(olympusSigner).swap();
  const daoTribeBalanceAfterOtc = await contracts.tribe.balanceOf(addresses.core);
  expect(daoTribeBalanceAfterOtc.sub(tribeInDaoTreasuryAfter)).to.be.equal(otcTribeAmount);
  expect(await contracts.gOHMHoldingPCVDeposit.balance()).to.be.equal(0);

  // Execute maxFeiWithdrawalGuard actions
  let i = 0;
  while (await contracts.maxFeiWithdrawalGuard.check()) {
    const protecActions = await contracts.maxFeiWithdrawalGuard.getProtecActions();
    const depositAddress = '0x' + protecActions.datas[0].slice(34, 74);
    const depositLabel = getAddressLabel(addresses, depositAddress);
    const withdrawAmountHex = '0x' + protecActions.datas[0].slice(138, 202);
    const withdrawAmountNum = Number(withdrawAmountHex) / 1e18;
    console.log('maxFeiWithdrawalGuard protec action #', ++i, depositLabel, 'withdraw', withdrawAmountNum);
    await contracts.pcvSentinel.protec(contracts.maxFeiWithdrawalGuard.address);
  }
  // Execute fuseWithdrawalGuard actions
  i = 0;
  while (await contracts.fuseWithdrawalGuard.check()) {
    const protecActions = await contracts.fuseWithdrawalGuard.getProtecActions();
    const depositAddress = '0x' + protecActions.datas[0].slice(34, 74);
    const depositLabel = getAddressLabel(addresses, depositAddress);
    const withdrawAmountHex = '0x' + protecActions.datas[0].slice(138, 202);
    const withdrawAmountNum = Number(withdrawAmountHex) / 1e18;
    console.log('fuseWithdrawalGuard   protec action #', ++i, depositLabel, 'withdraw', withdrawAmountNum);
    await contracts.pcvSentinel.protec(contracts.fuseWithdrawalGuard.address);
  }
};

export { deploy, setup, teardown, validate };

function getAddressLabel(addresses: NamedAddresses, address: string) {
  for (const key in addresses) {
    if (address.toLowerCase() == addresses[key].toLowerCase()) return key;
  }
  return '???';
}
