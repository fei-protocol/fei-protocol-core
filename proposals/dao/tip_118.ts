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
import { getImpersonatedSigner, overwriteChainlinkAggregator } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { BigNumber } from 'ethers';
import { ERC20HoldingPCVDeposit } from '@custom-types/contracts';

/*

Tribal Council proposal TIP_118

- Deploy ERC20Holding PCV Deposits for remaining PCV assets
- Deprecate LUSD, RAI and ETH PSMs
- Pause PCV Drip Controllers

*/

const toBN = BigNumber.from;

const fipNumber = 'tip_118';

let initialDAIPSMFeiBalance: BigNumber;
let pcvStatsBefore: PcvStats;
let daiBalanceBefore: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  ////// Deploy empty PCV deposits for remaining PCV assets
  const ERC20HoldingPCVDepositFactory = await ethers.getContractFactory('ERC20HoldingPCVDeposit');
  const wethHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.weth);
  await wethHoldingDeposit.deployTransaction.wait();
  logging && console.log('WETH holding deposit deployed to: ', wethHoldingDeposit.address);

  const lusdHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.lusd);
  await lusdHoldingDeposit.deployTransaction.wait();
  logging && console.log('LUSD holding deposit deployed to: ', lusdHoldingDeposit.address);

  const voltHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.volt);
  await voltHoldingDeposit.deployTransaction.wait();
  logging && console.log('VOLT holding deposit deployed to: ', voltHoldingDeposit.address);

  const daiHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.dai);
  await daiHoldingDeposit.deployTransaction.wait();
  logging && console.log('DAI holding deposit deployed to: ', daiHoldingDeposit.address);

  const gOHMHoldingPCVDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.gOHM);
  await gOHMHoldingPCVDeposit.deployTransaction.wait();
  logging && console.log('gOHM holding deposit deployed to: ', gOHMHoldingPCVDeposit.address);

  // Deploy agEUR Redeemer contract
  const angleEuroRedeemerFactory = await ethers.getContractFactory('AngleEuroRedeemer');
  const angleEuroRedeemer = await angleEuroRedeemerFactory.deploy(addresses.core);
  await angleEuroRedeemer.deployed();
  logging && console.log(`angleEuroRedeemer: ${angleEuroRedeemer.address}`);

  return {
    angleEuroRedeemer,
    wethHoldingDeposit,
    lusdHoldingDeposit,
    voltHoldingDeposit,
    daiHoldingDeposit,
    gOHMHoldingPCVDeposit
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  initialDAIPSMFeiBalance = await contracts.fei.balanceOf(addresses.daiFixedPricePSM);

  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, Math.round(ethPrice).toString(), '8');

  // read pcvStats before proposal execution
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();

  // angle multisig action : make enough USDC collateral available for redemptions
  const angleMultisigSigner = await getImpersonatedSigner(addresses.angleMultisig);
  await forceEth(angleMultisigSigner.address);
  await contracts.anglePoolManagerUsdc.connect(angleMultisigSigner).updateStrategyDebtRatio(
    addresses.angleStrategyUsdc1, // USDC strategy has 57M deployed
    '0'
  );
  await contracts.angleStrategyUsdc1.harvest();

  // read DAI PSM balance before proposal execution
  daiBalanceBefore = await contracts.dai.balanceOf(addresses.daiFixedPricePSM);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
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

  const wethHoldingDeposit = contracts.wethHoldingDeposit as ERC20HoldingPCVDeposit;
  const lusdHoldingDeposit = contracts.lusdHoldingDeposit as ERC20HoldingPCVDeposit;
  const voltHoldingDeposit = contracts.voltHoldingDeposit as ERC20HoldingPCVDeposit;
  const daiHoldingDeposit = contracts.daiHoldingDeposit as ERC20HoldingPCVDeposit;
  const gOHMHoldingPCVDeposit = contracts.gOHMHoldingPCVDeposit as ERC20HoldingPCVDeposit;

  const pcvGuardian = contracts.pcvGuardianNew;

  const EXPECTED_WETH_TRANSFER = toBN('23129630802267046361289');
  const EXPECTED_LUSD_TRANSFER = toBN('17765325999630072368537481');
  const EXPECTED_VOLT_TRANSFER = ethers.constants.WeiPerEther.mul(10_000_000);

  // 1. Validate all holding PCV Deposits configured correctly
  expect(await wethHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.weth);
  expect(await lusdHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.lusd);
  expect(await voltHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.volt);
  expect(await daiHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.dai);
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
  expect(await weth.balanceOf(wethHoldingDeposit.address)).to.be.at.least(EXPECTED_WETH_TRANSFER);
  expect(await lusd.balanceOf(lusdHoldingDeposit.address)).to.be.equal(EXPECTED_LUSD_TRANSFER);
  expect(await volt.balanceOf(voltHoldingDeposit.address)).to.be.equal(EXPECTED_VOLT_TRANSFER);

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

  // 7. Validate PSMs are no longer safe addresses
  expect(await pcvGuardian.isSafeAddress(ethPSM.address)).to.be.false;
  expect(await pcvGuardian.isSafeAddress(lusdPSM.address)).to.be.false;
  expect(await pcvGuardian.isSafeAddress(raiPSM.address)).to.be.false;

  // 8. New ERC20 holding deposits are safe addresses
  expect(await pcvGuardian.isSafeAddress(wethHoldingDeposit.address)).to.be.true;
  expect(await pcvGuardian.isSafeAddress(lusdHoldingDeposit.address)).to.be.true;
  expect(await pcvGuardian.isSafeAddress(voltHoldingDeposit.address)).to.be.true;
  expect(await pcvGuardian.isSafeAddress(daiHoldingDeposit.address)).to.be.true;
  expect(await pcvGuardian.isSafeAddress(gOHMHoldingPCVDeposit.address)).to.be.true;

  // 9. Skimmers are deprecated - paused and do not have PCV_CONTROLLER_ROLE
  const PCV_CONTROLLER_ROLE = ethers.utils.id('PCV_CONTROLLER_ROLE');
  expect(await contracts.ethPSMFeiSkimmer.paused()).to.be.true;
  expect(await core.hasRole(PCV_CONTROLLER_ROLE, addresses.ethPSMFeiSkimmer)).to.be.false;

  expect(await contracts.lusdPSMFeiSkimmer.paused()).to.be.true;
  expect(await core.hasRole(PCV_CONTROLLER_ROLE, addresses.lusdPSMFeiSkimmer)).to.be.false;

  // 10. daiFixedPricePSMFeiSkimmer granted PCV_CONTROLLER_ROLE and burns Fei
  expect(await core.hasRole(PCV_CONTROLLER_ROLE, addresses.daiFixedPricePSMFeiSkimmer)).to.be.true;
  expect(await fei.balanceOf(addresses.daiFixedPricePSM)).to.be.equal(ethers.constants.WeiPerEther.mul(20_000_000));

  // 11. gOHM received funds
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
  expect(daiRedeemed).to.be.at.least(ethers.utils.parseEther('9500000')); // >9.5M DAI

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

  // PCV Equity change should be neutral for this proposal
  expect(Number(eqDiff) / 1e18).to.be.at.least(-10000);
  expect(Number(eqDiff) / 1e18).to.be.at.most(+10000);
};

const validateHoldingDepositWithdrawal = async (contracts: NamedContracts, addresses: NamedAddresses) => {
  const wethHoldingDeposit = contracts.wethHoldingDeposit as ERC20HoldingPCVDeposit;

  const initialWethDepositBalance = await wethHoldingDeposit.balance(); // weth
  const initialEthDepositBalance = await wethHoldingDeposit.provider.getBalance(wethHoldingDeposit.address); // eth
  const transferAmount = ethers.constants.WeiPerEther.mul(1); // amount of ETH to transfer

  const ethWhale = '0x00000000219ab540356cbb839cbe05303d7705fa';
  const ethWhaleSigner = await getImpersonatedSigner(ethWhale);
  const depositAddress = addresses.wethHoldingDeposit as string;
  await ethWhaleSigner.sendTransaction({ to: depositAddress, value: transferAmount });

  await wethHoldingDeposit.wrapETH(); // wrap the deposited ETH to WETH, balance should have increased by 1 eth

  const expectedFinalWethBalance = transferAmount.add(initialWethDepositBalance).add(initialEthDepositBalance);
  expect(await wethHoldingDeposit.balance()).to.be.equal(expectedFinalWethBalance);
  expect(await contracts.weth.balanceOf(wethHoldingDeposit.address)).to.be.equal(expectedFinalWethBalance);

  const resistantBalanceAndFei = await wethHoldingDeposit.resistantBalanceAndFei();
  expect(resistantBalanceAndFei[0]).to.be.equal(expectedFinalWethBalance);
  expect(resistantBalanceAndFei[1]).to.be.equal(0);

  // Withdraw ERC20
  const receiver = '0xFc312F21E1D56D8dab5475FB5aaEFfB18B892a85';
  const guardianSigner = await getImpersonatedSigner(addresses.pcvGuardianNew);
  await forceEth(addresses.pcvGuardianNew);
  await wethHoldingDeposit.connect(guardianSigner).withdrawERC20(addresses.weth, receiver, transferAmount);

  expect(await wethHoldingDeposit.balance()).to.be.equal(initialWethDepositBalance.add(initialEthDepositBalance));
  expect(await contracts.weth.balanceOf(receiver)).to.be.equal(transferAmount);
};

export { deploy, setup, teardown, validate };
