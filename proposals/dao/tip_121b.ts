import hre, { ethers, artifacts } from 'hardhat';
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

/*

TIP_121b: Protocol ops and technical cleanup

*/

const fipNumber = 'tip_121b';

// FEI balance on the TC timelock
const TC_FEI_BALANCE = '2733169815107120096987175';

// TRIBE balance on the TC timelock
const TC_TRIBE_BALANCE = '2733170474316903966022879';

// LBP swapper fund limits
const MIN_LUSD_SWAP_LUSD = ethers.constants.WeiPerEther.mul(230_000);
const MIN_LUSD_SWAP_DAI = ethers.constants.WeiPerEther.mul(17_000_000);

const MIN_WETH_SWAP_WETH = ethers.constants.WeiPerEther.mul(900);
const MIN_WETH_SWAP_DAI = ethers.constants.WeiPerEther.mul(32_000_000);

let pcvStatsBefore: PcvStats;
let initialFeiSupply: BigNumber;
let initialTCTribeBalance: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log(`No deploy actions for fip${fipNumber}`);
  return {
    // put returned contract objects here
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();
  initialFeiSupply = await contracts.fei.totalSupply();
  initialTCTribeBalance = await contracts.tribe.balanceOf(addresses.core);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
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

  // 1. Verify FEI burned as expected
  const feiSupplyDiff = initialFeiSupply.sub(await contracts.fei.totalSupply());
  expect(feiSupplyDiff).to.equal(TC_FEI_BALANCE);

  // 2. Verify TRIBE sent to DAO treasury
  const tcTribeBalanceDiff = (await contracts.tribe.balanceOf(addresses.core)).sub(initialTCTribeBalance);
  expect(tcTribeBalanceDiff).to.equal(TC_TRIBE_BALANCE);

  // 3. Verify TC has no funds
  expect(await contracts.fei.balanceOf(addresses.tribalCouncilTimelock)).to.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.tribalCouncilTimelock)).to.equal(0);

  // 4. Verify no FEI on DAO timelock
  expect(await contracts.fei.balanceOf(addresses.feiDAOTimelock)).to.equal(0);

  // 5. Verify all LUSD, WETH and DAI moved out of LBP swappers
  // Verify nothing left on swappers
  expect(await contracts.dai.balanceOf(addresses.lusdToDaiSwapper)).to.equal(0);
  expect(await contracts.lusd.balanceOf(addresses.lusdToDaiSwapper)).to.equal(0);

  expect(await contracts.weth.balanceOf(addresses.ethToDaiLBPSwapper)).to.equal(0);
  expect(await contracts.dai.balanceOf(addresses.ethToDaiLBPSwapper)).to.equal(0);

  // Verify swapped tokens ended up at destinations correctly
  expect(await contracts.dai.balanceOf(addresses.daiHoldingPCVDeposit)).to.be.bignumber.greaterThan(
    MIN_LUSD_SWAP_DAI.add(MIN_WETH_SWAP_DAI) // DAI from WETH and LUSD swaps
  );
  expect(await contracts.lusd.balanceOf(addresses.tribalCouncilSafe)).to.be.bignumber.greaterThan(MIN_LUSD_SWAP_LUSD);
  expect(await contracts.weth.balanceOf(addresses.tribalCouncilSafe)).to.be.bignumber.greaterThan(MIN_WETH_SWAP_WETH);

  // 6. Verify stETH oracle set on CR
  expect(await contracts.collateralizationOracle.tokenToOracle(addresses.stETH)).to.equal(
    addresses.chainlinkStEthUsdOracleWrapper
  );
  // 7. Verify stETH oracle reports a reasonable price
  const stETHUSDPrice = await contracts.chainlinkStEthUsdOracleWrapper.read()[0];
  console.log('stETH USD price: ', stETHUSDPrice.toString());
};

export { deploy, setup, teardown, validate };
