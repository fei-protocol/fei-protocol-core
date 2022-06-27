import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc,
  PcvStats
} from '@custom-types/types';
import { getImpersonatedSigner, overwriteChainlinkAggregator, time, expectRevert } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, Contract } from 'ethers';

let pcvStatsBefore: PcvStats;
let ethPrice8Decimals: string;

const fipNumber = 'cr_oracle_cleanup';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy composite VOLT*1 oracle
  // This is needed because the VOLT OraclePassthrough does not have a paused() method
  const compositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const voltOracle = await compositeOracleFactory.deploy(
    addresses.core,
    addresses.oneConstantOracle,
    addresses.voltOraclePassthrough,
    false
  );
  await voltOracle.deployed();
  logging && console.log(`voltOracle: ${voltOracle.address}`);

  return {
    voltOracle
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  ethPrice8Decimals = Math.round((await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10).toString();
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, ethPrice8Decimals, '8');

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
  const pcvDiff: BigNumber = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff: BigNumber = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff: BigNumber = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', Number(pcvDiff) / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', Number(cFeiDiff) / 1e24);
  console.log(' Equity diff                            [M]e18 ', Number(eqDiff) / 1e24);
  console.log('----------------------------------------------------');

  // check the updated references
  expect(await contracts.pcvEquityMinter.collateralizationOracle()).to.be.equal(addresses.collateralizationOracle);
  expect(await contracts.tribeReserveStabilizer.collateralizationOracle()).to.be.equal(
    addresses.collateralizationOracle
  );

  // check the pcv equity minter value with new CR oracle
  // 65M$ equity at 20% APR is 250k$ per week
  const mintAmount: BigNumber = await contracts.pcvEquityMinter.mintAmount();
  expect(mintAmount).to.be.at.least(ethers.constants.WeiPerEther.mul('50000'));
  expect(mintAmount).to.be.at.most(ethers.constants.WeiPerEther.mul('500000'));

  // mock a very low ETH price to check activation of the TRIBE reserve stabilizer
  // 50$ / ETH
  expect(await contracts.tribeReserveStabilizer.isCollateralizationBelowThreshold()).to.be.false;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '5000000000', '8');
  // also mock TRIBE price to be 0.125$ (it's a composite oracle between ETH/USD and TRIBE/ETH)
  await overwriteChainlinkAggregator(addresses.chainlinkTribeEthOracle, '2500000000000000', '18');
  expect(await contracts.tribeReserveStabilizer.isCollateralizationBelowThreshold()).to.be.true;
  expect(await contracts.tribeReserveStabilizer.isTimeStarted()).to.be.false;
  await contracts.tribeReserveStabilizer.startOracleDelayCountdown();
  await time.increase(await contracts.tribeReserveStabilizer.duration());

  const pcvStatsLowEth: PcvStats = await contracts.collateralizationOracle.pcvStats();
  expect(pcvStatsLowEth.protocolEquity).to.be.at.most('0');

  // check the pcv equity minter when FEI is undercollateralized
  await expectRevert(contracts.pcvEquityMinter.mintAmount(), 'PCVEquityMinter: Equity is nonpositive');

  // simulate a tribe reserve stabilizer trigger
  const amountFei: BigNumber = ethers.constants.WeiPerEther.mul('40000000'); // redeem 40M FEI
  const feiHolderSigner: SignerWithAddress = await getImpersonatedSigner(addresses.feiTribePair);
  await forceEth(addresses.feiTribePair);
  await contracts.fei.connect(feiHolderSigner).approve(addresses.tribeReserveStabilizer, amountFei);
  await contracts.tribeReserveStabilizer.connect(feiHolderSigner).exchangeFei(amountFei);

  // back in positive equity
  const pcvStatsLowEth2: PcvStats = await contracts.collateralizationOracle.pcvStats();
  expect(pcvStatsLowEth2.protocolEquity).to.be.at.least('0');

  // restore ETH price
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, ethPrice8Decimals, '8');

  // unpause pcv equity minter and mint a buyback cycle
  const daoSigner: SignerWithAddress = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
  await forceEth(contracts.feiDAOTimelock.address);
  await contracts.pcvEquityMinter.connect(daoSigner).unpause();
  await contracts.pcvEquityMinter.mint(); // no revert = ok, auction started
  // fast-forward time so that e2e tests are not bricked
  await time.increase(await contracts.tribeReserveStabilizer.duration());
  await contracts.tribeReserveStabilizer.resetOracleDelayCountdown();

  //////  Ops optimistic timelock deprecation validation /////////
  expect(await contracts.core.hasRole(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), addresses.opsOptimisticTimelock)).to
    .be.false;
  expect(await contracts.core.hasRole(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), addresses.opsOptimisticTimelock))
    .to.be.false;
  expect(await contracts.core.hasRole(ethers.utils.id('ORACLE_ADMIN_ROLE'), addresses.opsOptimisticTimelock)).to.be
    .false;
};

export { deploy, setup, teardown, validate };
