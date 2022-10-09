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

/*

TIP_123

*/

let pcvStatsBefore: PcvStats;

const fipNumber = 'tip_123';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy DAOTimelockBurner, to burn admin of Fei and Rari DAO timelocks
  const DAOTimelockBurnerFactory = await ethers.getContractFactory('DAOTimelockBurner');
  const daoTimelockBurner = await DAOTimelockBurnerFactory.deploy();
  console.log('DAO timelock burner deployed to: ', daoTimelockBurner.address);

  const FeiTimelockBurnerFactory = await ethers.getContractFactory('FeiLinearTokenTimelockBurner');
  // 2. Deploy deprecated Rari FEI timelock burner
  const feiTimelockBurner1 = await FeiTimelockBurnerFactory.deploy(addresses.rariInfraFeiTimelock);
  console.log('Deprecated Rari FEI timelock burner deployed to: ', feiTimelockBurner1.address);

  // 3. Deploy deprecated Rari TRIBE timelock burner
  const TribeTimelockedDelegatorBurnerFactory = await ethers.getContractFactory('TribeTimelockedDelegatorBurner');
  const tribeTimelockBurner1 = await TribeTimelockedDelegatorBurnerFactory.deploy(addresses.rariInfraTribeTimelock);
  console.log('Deprecated Rari TRIBE timelock burned deployed to: ', tribeTimelockBurner1.address);

  // 4. Deploy Fei Labs burner
  const tribeTimelockBurner2 = await TribeTimelockedDelegatorBurnerFactory.deploy(addresses.feiLabsVestingTimelock);
  console.log('Fei Labs TRIBE burner deployed to: ', tribeTimelockBurner2.address);

  return {
    daoTimelockBurner,
    feiTimelockBurner1,
    tribeTimelockBurner1,
    tribeTimelockBurner2
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
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
  const pcvDiff = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', Number(pcvDiff) / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', Number(cFeiDiff) / 1e24);
  console.log(' Equity diff                            [M]e18 ', Number(eqDiff) / 1e24);
  console.log('----------------------------------------------------');

  // 0. Assert overcollaterised
  expect(await contracts.collateralizationOracle.isOvercollateralized()).to.be.true;

  // 1. Verify Fei DAO timelock admin burned
  expect(await contracts.feiDAOTimelock.admin()).to.equal(addresses.daoTimelockBurner);

  // 2. Verify Rari Fei deprecated timelock burned
  expect(await contracts.rariInfraFeiTimelock.beneficiary()).to.equal(addresses.feiTimelockBurner1);

  // 3. Verify Rari Tribe deprecated timelock burned
  expect(await contracts.rariInfraTribeTimelock.beneficiary()).to.equal(addresses.tribeTimelockBurner1);

  // 4. Verify Fei Labs Tribe timelock burned
  expect(await contracts.feiLabsVestingTimelock.beneficiary()).to.equal(addresses.tribeTimelockBurner2);

  // 4. Verify Tribe minter set to zero address and inflation is the minimum of 0.01% (1 basis point)
  expect(await contracts.tribe.minter()).to.equal(ethers.constants.AddressZero);
  expect(await contracts.tribeMinter.annualMaxInflationBasisPoints()).to.equal(1);
};

export { deploy, setup, teardown, validate };
