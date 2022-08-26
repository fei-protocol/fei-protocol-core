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
import { getImpersonatedSigner } from '@test/helpers';
import { BigNumber } from 'ethers';
import { abi as timelockABI } from '../../../artifacts/contracts/timelocks/TimelockedDelegator.sol/TimelockedDelegator.json';
import { ERC20, LinearUnlockTimelock } from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { forceEth } from '@test/integration/setup/utils';

const toBN = ethers.BigNumber.from;

const fipNumber = 'phase_1';

// Approximate bounds on the FEI to be burned after LP tokens redeemed
const LOWER_BOUND_FEI = ethers.constants.WeiPerEther.mul(25_000_000);
const UPPER_BOUND_FEI = ethers.constants.WeiPerEther.mul(35_000_000);

// Expected bounds on the TRIBE to be transferred to the Core Treasury after LP tokens redeemed
const LOWER_BOUND_TRIBE = ethers.constants.WeiPerEther.mul(120_000_000);
const UPPER_BOUND_TRIBE = ethers.constants.WeiPerEther.mul(260_000_000);

// Expected bounds on the number of FEI-TRIBE LP tokens to be relocked in a timelock
const LOWER_BOUND_LP_TOKENS = ethers.constants.WeiPerEther.mul(15_000_000);
const UPPER_BOUND_LP_TOKENS = ethers.constants.WeiPerEther.mul(30_000_000);

// Fei Labs LP tokens to release
const LABS_LP_TOKENS_VESTED = ethers.constants.WeiPerEther.mul(14_000_000);

// Fei Labs TRIBE tokens to release
const LABS_TRIBE_TOKENS_VESTED = ethers.constants.WeiPerEther.mul(40_413_000);

// DAO timelock TRIBE sent to Core
const DAO_TIMELOCK_TRIBE = toBN('16928757542558284368284929');

let initialFeiTotalSupply: BigNumber;
let initialTribeTreasuryBalance: BigNumber;
let initialLabsLPTokens: BigNumber;
let initialLabsTribeTokens: BigNumber;
let pcvStatsBefore: PcvStats;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy new linear token timelock to hold the remaining investor LP tokens
  // Get the remaining duration on the Fei Tribe Liquidity timelock
  const uniswapFeiTribeLiquidityTimelock = await ethers.getContractAt(
    'LinearTokenTimelock',
    addresses.uniswapFeiTribeLiquidityTimelock
  );
  const uniswapFeiTribeLiquidityTimelockRemainingDuration = await uniswapFeiTribeLiquidityTimelock.remainingTime();
  console.log('Remaining time: ', uniswapFeiTribeLiquidityTimelockRemainingDuration.toString());

  const LinearTokenTimelockedFactory = await ethers.getContractFactory('LinearUnlockTimelock');
  const investorUniswapFeiTribeTimelock = await LinearTokenTimelockedFactory.deploy(
    addresses.core,
    addresses.feiLabs, // beneficiary
    uniswapFeiTribeLiquidityTimelockRemainingDuration, // duration
    addresses.feiTribePair, // token - FEI/TRIBE LP tokens
    0, // secondsUntilCliff - have already passed the cliff

    // clawbackAdmin - NO CLAWBACK ADMIN
    ethers.constants.AddressZero,
    0 // startTime
  );
  await investorUniswapFeiTribeTimelock.deployTransaction.wait();

  logging && console.log('New investor timelock deployed to: ', investorUniswapFeiTribeTimelock.address);

  // 2. Deploy Uniswap Fei Tribe Liquidity Remover helper contract
  const UniswapLiquidityRemoverFactory = await ethers.getContractFactory('UniswapLiquidityRemover');
  const uniswapLiquidityRemover = await UniswapLiquidityRemoverFactory.deploy(addresses.core);
  await uniswapLiquidityRemover.deployTransaction.wait();
  console.log('Uniswap liquidity remover deployed to: ', uniswapLiquidityRemover.address);

  return {
    uniswapLiquidityRemover,
    investorUniswapFeiTribeTimelock
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  initialFeiTotalSupply = await contracts.fei.totalSupply();
  initialTribeTreasuryBalance = await contracts.tribe.balanceOf(addresses.core);
  initialLabsLPTokens = await contracts.feiTribePair.balanceOf(addresses.feiLabs);
  initialLabsTribeTokens = await contracts.tribe.balanceOf(addresses.feiLabs);
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
  // 1. Validate investor Uniswap liquidity funds timelock configured
  expect(await contracts.investorUniswapFeiTribeTimelock.beneficiary()).to.be.equal(addresses.feiLabs);
  expect(await contracts.investorUniswapFeiTribeTimelock.clawbackAdmin()).to.be.equal(ethers.constants.AddressZero);
  expect(await contracts.investorUniswapFeiTribeTimelock.lockedToken()).to.be.equal(addresses.feiTribePair);
  // expect(await contracts.investorUniswapFeiTribeTimelock.duration()).to.be.equal();
  expect(await contracts.investorUniswapFeiTribeTimelock.cliffSeconds()).to.be.equal(0);

  // 2. Validate Uniswap liquidity remover configured
  expect(await contracts.uniswapLiquidityRemover.UNISWAP_ROUTER()).to.be.equal(addresses.uniswapRouter);
  expect(await contracts.uniswapLiquidityRemover.FEI_TRIBE_PAIR()).to.be.equal(addresses.feiTribePair);

  // 3. Validate Fei Labs vesting timelock accepted beneficiary
  expect(await contracts.feiLabsVestingTimelock.beneficiary()).to.be.equal(addresses.feiDAOTimelock);

  // 4. Uniswap LP liquidity timelock should have no LP tokens or FEI or TRIBE
  expect(await contracts.feiTribePair.balanceOf(addresses.uniswapFeiTribeLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.fei.balanceOf(addresses.uniswapFeiTribeLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.uniswapFeiTribeLiquidityTimelock)).to.be.equal(0);
  expect(await contracts.feiTribeLBP.balanceOf(addresses.feiDAOTimelock)).to.be.equal(0);

  // 5. Fei liquidity should have been burned, TRIBE should have been sent to Treasury
  const feiBurned = initialFeiTotalSupply.sub(await contracts.fei.totalSupply());
  console.log('FEI redeemed and burned from Uniswap liquidity [M]e18: ', Number(feiBurned) / 1e24);
  expect(feiBurned).to.be.bignumber.greaterThan(LOWER_BOUND_FEI);
  expect(feiBurned).to.be.bignumber.lessThan(UPPER_BOUND_FEI);

  // Validate TRIBE sent to Treasury
  const tribeRedeemed = (await contracts.tribe.balanceOf(addresses.core))
    .sub(initialTribeTreasuryBalance)
    .sub(DAO_TIMELOCK_TRIBE);
  expect(tribeRedeemed).to.be.bignumber.greaterThan(LOWER_BOUND_TRIBE);
  expect(tribeRedeemed).to.be.bignumber.lessThan(UPPER_BOUND_TRIBE);
  console.log('TRIBE redeemed from Uniswap liquidity [M]e18: ', Number(tribeRedeemed) / 1e24);

  // 6. Validate investor LP tokens
  const investorUniswapTimelockFunds = await contracts.feiTribePair.balanceOf(
    addresses.investorUniswapFeiTribeTimelock
  );
  console.log('Investor LP tokens locked in new timelock [M]e18: ', Number(investorUniswapTimelockFunds) / 1e24);
  expect(investorUniswapTimelockFunds).to.be.bignumber.greaterThan(LOWER_BOUND_LP_TOKENS);
  expect(investorUniswapTimelockFunds).to.be.bignumber.lessThan(UPPER_BOUND_LP_TOKENS);

  const remainingLPTokensInUniswapTimelock = await contracts.feiTribePair.balanceOf(
    addresses.uniswapFeiTribeLiquidityTimelock
  );
  expect(remainingLPTokensInUniswapTimelock).to.be.equal(0);

  // 7. Validate TRIBE approval revoked from Tribal Council timelock
  expect(await contracts.tribe.allowance(addresses.feiDAOTimelock, addresses.tribalCouncilTimelock)).to.equal(0);

  // 8. Validate DAO Timelock has no more TRIBE
  expect(await contracts.tribe.balanceOf(addresses.feiDAOTimelock)).to.be.equal(0);

  // 9. Validate Fei Labs vested funds
  const feiLabsClaimedLPTokens = await contracts.feiTribePair.balanceOf(addresses.feiLabs);
  const feiLabsClaimedTribe = await contracts.tribe.balanceOf(addresses.feiLabs);

  // 10. Validate that investor unlock beneficiary can claim from linear vesting timelock
  await forceEth(addresses.feiLabs);
  await validateBeneficiaryCanClaim(
    contracts.investorUniswapFeiTribeTimelock as LinearUnlockTimelock,
    contracts.feiTribePair as ERC20,
    addresses.feiLabs
  );

  // 11. Validate that DAO can unlock investor timelock
  await forceEth(addresses.feiDAOTimelock);
  const daoSigner = await getImpersonatedSigner(addresses.feiDAOTimelock);
  await validateTimelockUnlock(
    contracts.investorUniswapFeiTribeTimelock as LinearUnlockTimelock,
    daoSigner,
    contracts.feiTribePair as ERC20,
    addresses.feiLabs
  );

  // 12. Sanity check PCV stats:
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
};

const validateBeneficiaryCanClaim = async (
  tokenTimelock: LinearUnlockTimelock,
  feiTribePair: ERC20,
  beneficiary: string
) => {
  const beneficiaryBalanceBefore = await feiTribePair.balanceOf(beneficiary);

  const feiLabsTreasurySigner = await getImpersonatedSigner(beneficiary);
  await tokenTimelock.connect(feiLabsTreasurySigner).releaseMax(beneficiary);

  const balanceDiff = (await feiTribePair.balanceOf(beneficiary)).sub(beneficiaryBalanceBefore);
  expect(balanceDiff).to.be.bignumber.greaterThan(toBN(0));
};

const validateTimelockUnlock = async (
  tokenTimelock: LinearUnlockTimelock,
  daoSigner: SignerWithAddress,
  feiTribePair: ERC20,
  beneficiary: string
) => {
  const beneficiaryBalanceBefore = await feiTribePair.balanceOf(beneficiary);
  await tokenTimelock.connect(daoSigner).unlockLiquidity();

  const balanceDiff = (await feiTribePair.balanceOf(beneficiary)).sub(beneficiaryBalanceBefore);
  expect(balanceDiff).to.be.bignumber.greaterThan(LOWER_BOUND_LP_TOKENS);
  expect(balanceDiff).to.be.bignumber.lessThan(UPPER_BOUND_LP_TOKENS);
};

export { deploy, setup, teardown, validate };
