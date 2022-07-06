import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  PcvStats,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, overwriteChainlinkAggregator, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { BigNumber } from 'ethers';
import { ERC20HoldingPCVDeposit } from '@custom-types/contracts';

/*

Tribal Council proposal TIP_118

- Deploy ERC20Holding PCV Deposits for remaining PCV assets
- Deprecate LUSD, RAI and ETH PSMs
- Pause PCV Drip Controllers and deprecate skimmers
- Complete deprecation of TRIBE incentives system by withdrawing excess TRIBE

*/

const toBN = BigNumber.from;

const fipNumber = 'tip_118';

let pcvStatsBefore: PcvStats;
let daiBalanceBefore: BigNumber;
let initialCoreTribeBalance: BigNumber;
let initialRariDelegatorBalance: BigNumber;

// WETH being transferred from the ETH PSM to the WETH holding deposit
const EXPECTED_WETH_TRANSFER = toBN('21716293570455965978548');

// LUSD being transferred from the LUSD PSM to the LUSD holding deposit
const EXPECTED_LUSD_TRANSFER = toBN('18751528591939383399383172');

// VOLT being transferred from the DAO timelock to the VOLT holding deposit
const EXPECTED_VOLT_TRANSFER = ethers.constants.WeiPerEther.mul(10_000_000);

// Sanity check minimum amount of TRIBE that should be recovered from the incentives system
const MIN_EXPECTED_TRIBE_RECOVERY = ethers.constants.WeiPerEther.mul(30_000_000);

// Minimum expected remaining TRIBE LP rewards required to cover outstanding pending rewards
const REMAINING_TRIBE_LP_REWARDS = ethers.constants.WeiPerEther.mul(564_000);

// Excess TRIBE that can be recovered from the Rari rewards distribution system
const EXCESS_RARI_TRIBE = ethers.constants.WeiPerEther.mul(150_000);

// Maximum remaining excess TRIBE buffer on the TribalChief, beyond the 564k to be paid out
const MAX_REMAINING_EXCESS_CHIEF_BALANCE = ethers.constants.WeiPerEther.mul(50_000);

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  ////// Deploy empty PCV deposits for remaining PCV assets
  const ERC20HoldingPCVDepositFactory = await ethers.getContractFactory('ERC20HoldingPCVDeposit');
  const wethHoldingPCVDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.weth);
  await wethHoldingPCVDeposit.deployTransaction.wait();
  logging && console.log('WETH holding deposit deployed to: ', wethHoldingPCVDeposit.address);

  const lusdHoldingPCVDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.lusd);
  await lusdHoldingPCVDeposit.deployTransaction.wait();
  logging && console.log('LUSD holding deposit deployed to: ', lusdHoldingPCVDeposit.address);

  const voltHoldingPCVDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.volt);
  await voltHoldingPCVDeposit.deployTransaction.wait();
  logging && console.log('VOLT holding deposit deployed to: ', voltHoldingPCVDeposit.address);

  const daiHoldingPCVDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.dai);
  await daiHoldingPCVDeposit.deployTransaction.wait();
  logging && console.log('DAI holding deposit deployed to: ', daiHoldingPCVDeposit.address);

  const gOHMHoldingPCVDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.gOHM);
  await gOHMHoldingPCVDeposit.deployTransaction.wait();
  logging && console.log('gOHM holding deposit deployed to: ', gOHMHoldingPCVDeposit.address);

  // Deploy agEUR Redeemer contract
  const angleEuroRedeemerFactory = await ethers.getContractFactory('AngleEuroRedeemer');
  const angleEuroRedeemer = await angleEuroRedeemerFactory.deploy(addresses.core);
  await angleEuroRedeemer.deployed();
  logging && console.log(`angleEuroRedeemer: ${angleEuroRedeemer.address}`);

  // Deploy implementation
  const vlAuraDelegatorPCVDepositFactory = await ethers.getContractFactory('VlAuraDelegatorPCVDeposit');
  const vlAuraDelegatorPCVDepositImplementation = await vlAuraDelegatorPCVDepositFactory.deploy(addresses.core);
  await vlAuraDelegatorPCVDepositImplementation.deployTransaction.wait();
  logging && console.log('vlAuraDelegatorPCVDepositImplementation: ', vlAuraDelegatorPCVDepositImplementation.address);

  return {
    vlAuraDelegatorPCVDepositImplementation,
    angleEuroRedeemer,
    wethHoldingPCVDeposit,
    lusdHoldingPCVDeposit,
    voltHoldingPCVDeposit,
    daiHoldingPCVDeposit,
    gOHMHoldingPCVDeposit
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, Math.round(ethPrice).toString(), '8');
  // chainlink EURUSD
  const eurPrice = (await contracts.chainlinkEurUsdOracleWrapper.read())[0].toString() / 1e10;
  await overwriteChainlinkAggregator(addresses.chainlinkEurUsdOracle, Math.round(eurPrice).toString(), '8');
  // also overwrite chainlink USDCUSD oracle
  await overwriteChainlinkAggregator('0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', '100000000', '8');

  // angle multisig action : make enough USDC collateral available for redemptions
  const angleMultisigSigner = await getImpersonatedSigner(addresses.angleMultisig);
  await forceEth(angleMultisigSigner.address);
  await contracts.anglePoolManagerUsdc.connect(angleMultisigSigner).updateStrategyDebtRatio(
    addresses.angleStrategyUsdc1, // USDC strategy has 57M deployed
    '0'
  );
  await contracts.angleStrategyUsdc1.harvest();

  // Prevent the oracle from being expired
  // This is because on a local mainnet fork, time is not accurate and Angle Protocol
  // considers their oracles expired otherwise.
  const oracleAbi = ['function changeStalePeriod(uint32 _stalePeriod)'];
  const oracleInterface = new ethers.utils.Interface(oracleAbi);
  const encodeOracleCall = oracleInterface.encodeFunctionData('changeStalePeriod', ['1000000000']);
  await (
    await angleMultisigSigner.sendTransaction({
      data: encodeOracleCall,
      to: '0x631C43612C498642211110Ba3026a6773b7fb7Fe' // Angle USDC/EUR oracle
    })
  ).wait();

  // read DAI PSM balance before proposal execution
  daiBalanceBefore = await contracts.dai.balanceOf(addresses.daiFixedPricePSM);

  // read initial balances
  initialCoreTribeBalance = await contracts.tribe.balanceOf(addresses.core);
  initialRariDelegatorBalance = await contracts.tribe.balanceOf(addresses.rariRewardsDistributorDelegator);

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
  // Aura Airdrop check
  // We have to fast forward to next week, because AURA locking works per epoch and if we checked
  // the vlAURA balance right after execution, it would be 0.
  await time.increase(7 * 24 * 3600 + 1);
  expect(await contracts.vlAuraDelegatorPCVDeposit.aura()).to.be.equal(addresses.aura);
  expect(await contracts.vlAuraDelegatorPCVDeposit.auraLocker()).to.be.equal(addresses.vlAura);
  expect(await contracts.vlAuraDelegatorPCVDeposit.auraMerkleDrop()).to.be.equal(addresses.auraMerkleDrop);
  expect(await contracts.vlAuraDelegatorPCVDeposit.token()).to.be.equal(addresses.vlAura);
  expect(await contracts.vlAuraDelegatorPCVDeposit.delegate()).to.be.equal(addresses.eswak);
  const auraLocked = await contracts.vlAura.balanceOf(contracts.vlAuraDelegatorPCVDeposit.address);
  expect(auraLocked).to.be.at.least(ethers.utils.parseEther('23438'));
  const auraBalance = await contracts.vlAuraDelegatorPCVDeposit.balance();
  expect(auraBalance).to.be.at.least(ethers.utils.parseEther('23438'));

  ////////// Validate empty PCV deposit deployments
  const core = contracts.core;
  const ethPSM = contracts.ethPSM;
  const lusdPSM = contracts.lusdPSM;
  const raiPSM = contracts.raiPriceBoundPSM;

  const fei = contracts.fei;
  const lusd = contracts.lusd;
  const weth = contracts.weth;
  const volt = contracts.volt;
  const gOHM = contracts.gOHM;

  const wethHoldingPCVDeposit = contracts.wethHoldingPCVDeposit as ERC20HoldingPCVDeposit;
  const lusdHoldingPCVDeposit = contracts.lusdHoldingPCVDeposit as ERC20HoldingPCVDeposit;
  const voltHoldingPCVDeposit = contracts.voltHoldingPCVDeposit as ERC20HoldingPCVDeposit;
  const daiHoldingPCVDeposit = contracts.daiHoldingPCVDeposit as ERC20HoldingPCVDeposit;
  const gOHMHoldingPCVDeposit = contracts.gOHMHoldingPCVDeposit as ERC20HoldingPCVDeposit;

  // 1. Validate all holding PCV Deposits configured correctly
  expect(await wethHoldingPCVDeposit.balanceReportedIn()).to.be.equal(addresses.weth);
  expect(await lusdHoldingPCVDeposit.balanceReportedIn()).to.be.equal(addresses.lusd);
  expect(await voltHoldingPCVDeposit.balanceReportedIn()).to.be.equal(addresses.volt);
  expect(await daiHoldingPCVDeposit.balanceReportedIn()).to.be.equal(addresses.dai);
  expect(await gOHMHoldingPCVDeposit.balanceReportedIn()).to.be.equal(addresses.gOHM);

  // 2. Validate can withdraw funds from a holding deposit
  await validateHoldingDepositWithdrawal(contracts, addresses);

  // 3. Validate deprecated PSMs have no assets
  expect(await fei.balanceOf(ethPSM.address)).to.be.equal(0);
  expect(await weth.balanceOf(ethPSM.address)).to.be.equal(0);

  expect(await fei.balanceOf(lusdPSM.address)).to.be.equal(0);
  expect(await lusd.balanceOf(lusdPSM.address)).to.be.equal(0);

  // 4. Validate transferred assets were received

  // These deposits started off empty
  // Minting currently enabled on ETH PSM, so WETH balance may increase
  expect(await weth.balanceOf(wethHoldingPCVDeposit.address)).to.be.at.least(EXPECTED_WETH_TRANSFER);
  expect(await lusd.balanceOf(lusdHoldingPCVDeposit.address)).to.be.at.least(EXPECTED_LUSD_TRANSFER);
  expect(await volt.balanceOf(voltHoldingPCVDeposit.address)).to.be.equal(EXPECTED_VOLT_TRANSFER);

  // 5. Validate deprecated PSMs have no MINTER_ROLE
  const MINTER_ROLE = ethers.utils.id('MINTER_ROLE');
  expect(await core.hasRole(MINTER_ROLE, addresses.ethPSM)).to.be.false;
  expect(await core.hasRole(MINTER_ROLE, addresses.raiPriceBoundPSM)).to.be.false;
  expect(await core.hasRole(MINTER_ROLE, addresses.lusdPSM)).to.be.false;

  // 6. Validate deprecated PSMs fully paused
  expect(await ethPSM.redeemPaused()).to.be.true;
  expect(await ethPSM.paused()).to.be.true;

  expect(await lusdPSM.redeemPaused()).to.be.true;
  expect(await lusdPSM.paused()).to.be.true;

  expect(await raiPSM.redeemPaused()).to.be.true;
  expect(await raiPSM.mintPaused()).to.be.true;
  expect(await raiPSM.paused()).to.be.true;

  // 7. Skimmers are deprecated - paused and do not have PCV_CONTROLLER_ROLE
  const PCV_CONTROLLER_ROLE = ethers.utils.id('PCV_CONTROLLER_ROLE');
  expect(await contracts.ethPSMFeiSkimmer.paused()).to.be.true;
  expect(await core.hasRole(PCV_CONTROLLER_ROLE, addresses.ethPSMFeiSkimmer)).to.be.false;

  expect(await contracts.lusdPSMFeiSkimmer.paused()).to.be.true;
  expect(await core.hasRole(PCV_CONTROLLER_ROLE, addresses.lusdPSMFeiSkimmer)).to.be.false;

  // 8. daiFixedPricePSMFeiSkimmer granted PCV_CONTROLLER_ROLE and burns Fei
  expect(await core.hasRole(PCV_CONTROLLER_ROLE, addresses.daiFixedPricePSMFeiSkimmer)).to.be.true;
  expect(await fei.balanceOf(addresses.daiFixedPricePSM)).to.be.equal(ethers.constants.WeiPerEther.mul(20_000_000));

  // 9. gOHM received funds
  expect(await gOHM.balanceOf(addresses.gOHMHoldingPCVDeposit)).to.be.equal('577180000000000000000');

  // ------------------------------------------------------------
  // ANGLE and agEUR Deprecation
  // ------------------------------------------------------------
  // check ANGLE token movement
  expect(await contracts.angle.balanceOf(addresses.angleDelegatorPCVDeposit)).to.be.equal('0');
  expect(await contracts.angle.balanceOf(addresses.tribalCouncilSafe)).to.be.at.least(
    ethers.utils.parseEther('200000')
  );
  // check deposit is empty
  expect(await contracts.agEurUniswapPCVDeposit.balance()).to.be.equal('0');
  expect(await contracts.fei.balanceOf(addresses.agEurUniswapPCVDeposit)).to.be.equal('0');
  expect(await contracts.agEUR.balanceOf(addresses.agEurUniswapPCVDeposit)).to.be.equal('0');

  // check redemptions of agEUR > DAI
  const daiRedeemed = (await contracts.dai.balanceOf(addresses.daiFixedPricePSM)).sub(daiBalanceBefore);
  console.log('daiRedeemed', daiRedeemed.toString() / 1e18);
  expect(daiRedeemed).to.be.at.least(ethers.utils.parseEther('8000000')); // >8M DAI

  // check redeemer is empty
  expect(await contracts.agEUR.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');
  expect(await contracts.fei.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');
  expect(await contracts.dai.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');
  expect(await contracts.usdc.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');

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

  // VOLT interest yields ~35k$ in 3 days of proposal time that is fast-forwarded
  // Have removed rariPool128FeiPCVDepositWrapper (~$25k FEI) and rariPool22FeiPCVDepositWrapper (~$34k FEI)
  // Both configured in fuseWithdrawalGuard
  // So equity diff may fluctuate from -$24k to +$35k over the next few days
  // PCV Equity change should be neutral for this proposal
  expect(Number(eqDiff) / 1e18).to.be.at.least(-50000);
  expect(Number(eqDiff) / 1e18).to.be.at.most(+50000);

  ////////////// TIP 109: Validate TRIBE incentives system deprecation
  await validateIncentivesSystemDeprecation(contracts, addresses);

  // Validate DAI PSM redemption spread reduced
  expect(await contracts.daiFixedPricePSM.redeemFeeBasisPoints()).to.be.equal(ethers.BigNumber.from(3));
  expect(await contracts.daiFixedPricePSM.mintFeeBasisPoints()).to.be.equal(ethers.BigNumber.from(3));
};

const validateIncentivesSystemDeprecation = async (contracts: NamedContracts, addresses: NamedAddresses) => {
  const tribe = contracts.tribe;
  const core = contracts.core;
  const tribalChief = contracts.tribalChief;

  // 0. Verify all staking token wrapper pending rewards are zero
  expect(await tribalChief.pendingRewards(3, addresses.stakingTokenWrapperRari)).to.equal(0);
  expect(await tribalChief.pendingRewards(4, addresses.stakingTokenWrapperGROLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(5, addresses.stakingTokenWrapperFOXLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(6, addresses.stakingTokenWrapperUMALaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(7, addresses.stakingTokenWrapperSYNLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(8, addresses.stakingTokenWrapperNEARLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(9, addresses.stakingTokenWrapperKYLINLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(10, addresses.stakingTokenWrapperMStableLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(11, addresses.stakingTokenWrapperPoolTogetherLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(12, addresses.stakingTokenWrapperBribeD3pool)).to.equal(0);
  expect(await tribalChief.pendingRewards(13, addresses.d3StakingTokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(14, addresses.fei3CrvStakingtokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(15, addresses.feiDaiStakingTokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(16, addresses.feiUsdcStakingTokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(17, addresses.stakingTokenWrapperBribe3Crvpool)).to.equal(0);

  // 1. Validate all the locations TRIBE was withdrawn from are empty
  expect(await tribe.balanceOf(addresses.votiumBriber3Crvpool)).to.equal(0);
  expect(await tribe.balanceOf(addresses.erc20Dripper)).to.equal(0);
  expect(await tribe.balanceOf(addresses.votiumBriberD3pool)).to.equal(0);

  // 2. Validate TribalChief has sufficient TRIBE to fund LP staking deposits
  expect(await tribe.balanceOf(addresses.tribalChief)).to.be.bignumber.at.least(REMAINING_TRIBE_LP_REWARDS);

  // Validate remaining balance of TribalChief is small
  const finalTribalChiefBalance = await tribe.balanceOf(addresses.tribalChief);
  console.log('Final TribalChief balance:', finalTribalChiefBalance.toString());
  expect(finalTribalChiefBalance).to.be.bignumber.lessThan(
    MAX_REMAINING_EXCESS_CHIEF_BALANCE.add(REMAINING_TRIBE_LP_REWARDS)
  );

  // 3. Validate excess TRIBE was pulled from Rari rewards delegate
  const finalRariDelegatorBalance = await tribe.balanceOf(addresses.rariRewardsDistributorDelegator);
  const extractedRariTribe = initialRariDelegatorBalance.sub(finalRariDelegatorBalance);
  expect(extractedRariTribe).to.be.bignumber.at.least(EXCESS_RARI_TRIBE); // At least check, as rewards may have been claimed also

  // 4. Validate expected TRIBE recovery amount was retrieved
  const finalCoreTribeBalance = await tribe.balanceOf(addresses.core);
  const tribeRecovered = finalCoreTribeBalance.sub(initialCoreTribeBalance);
  console.log('Tribe recovered: ', tribeRecovered.toString());
  expect(tribeRecovered).to.be.bignumber.at.least(MIN_EXPECTED_TRIBE_RECOVERY);

  // 5. Validate Aave incentives controller proxy admin was changed
  const aaveLendingPoolAddressesProviderSigner = await getImpersonatedSigner(
    addresses.aaveLendingPoolAddressesProvider
  );
  const proxyABI = ['function admin() returns (address)'];
  const aaveTribeIncentivesControllerAsProxy = new ethers.Contract(addresses.aaveTribeIncentivesController, proxyABI);
  await forceEth(addresses.aaveTribeIncentivesController);
  expect(
    await aaveTribeIncentivesControllerAsProxy.connect(aaveLendingPoolAddressesProviderSigner).callStatic.admin()
  ).to.be.equal(addresses.aaveLendingPoolAddressesProvider);

  // 6. Validate TRIBAL_CHIEF_ADMIN_ROLE is revoked
  expect(await core.hasRole(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.tribalCouncilTimelock)).to.be.false;
  expect(await core.hasRole(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.optimisticTimelock)).to.be.false;
};

const validateHoldingDepositWithdrawal = async (contracts: NamedContracts, addresses: NamedAddresses) => {
  const wethHoldingPCVDeposit = contracts.wethHoldingPCVDeposit as ERC20HoldingPCVDeposit;

  const initialWethDepositBalance = await wethHoldingPCVDeposit.balance(); // weth
  const initialEthDepositBalance = await wethHoldingPCVDeposit.provider.getBalance(wethHoldingPCVDeposit.address); // eth
  const transferAmount = ethers.constants.WeiPerEther.mul(1); // amount of ETH to transfer

  const ethWhale = '0x00000000219ab540356cbb839cbe05303d7705fa';
  const ethWhaleSigner = await getImpersonatedSigner(ethWhale);
  const depositAddress = addresses.wethHoldingPCVDeposit as string;
  await ethWhaleSigner.sendTransaction({ to: depositAddress, value: transferAmount });

  await wethHoldingPCVDeposit.wrapETH(); // wrap the deposited ETH to WETH, balance should have increased by 1 eth

  const expectedFinalWethBalance = transferAmount.add(initialWethDepositBalance).add(initialEthDepositBalance);
  expect(await wethHoldingPCVDeposit.balance()).to.be.equal(expectedFinalWethBalance);
  expect(await contracts.weth.balanceOf(wethHoldingPCVDeposit.address)).to.be.equal(expectedFinalWethBalance);

  const resistantBalanceAndFei = await wethHoldingPCVDeposit.resistantBalanceAndFei();
  expect(resistantBalanceAndFei[0]).to.be.equal(expectedFinalWethBalance);
  expect(resistantBalanceAndFei[1]).to.be.equal(0);

  // Withdraw ERC20
  const receiver = '0xFc312F21E1D56D8dab5475FB5aaEFfB18B892a85';
  const guardianSigner = await getImpersonatedSigner(addresses.pcvGuardian);
  await forceEth(addresses.pcvGuardian);
  await wethHoldingPCVDeposit.connect(guardianSigner).withdrawERC20(addresses.weth, receiver, transferAmount);

  expect(await wethHoldingPCVDeposit.balance()).to.be.equal(initialWethDepositBalance.add(initialEthDepositBalance));
  expect(await contracts.weth.balanceOf(receiver)).to.be.equal(transferAmount);
};

export { deploy, setup, teardown, validate };
