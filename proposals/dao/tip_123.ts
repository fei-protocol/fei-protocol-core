import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  PcvStats,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { forceEth } from '@test/integration/setup/utils';
import { getImpersonatedSigner, time } from '@test/helpers';

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

  // Verify no addresses have GOVERN_ROLE, GUARDIAN_ROLE. One has PCV_CONTROLLER_ROLE, one has MINTER
  expect(await contracts.core.getRoleMemberCount(ethers.utils.id('GOVERN_ROLE'))).to.equal(0);
  expect(await contracts.core.getRoleMemberCount(ethers.utils.id('GUARDIAN_ROLE'))).to.equal(0);
  expect(await contracts.core.getRoleMemberCount(ethers.utils.id('PCV_CONTROLLER_ROLE'))).to.equal(1);
  expect(await contracts.core.getRoleMemberCount(ethers.utils.id('MINTER_ROLE'))).to.equal(1);

  // 2. Verify Rari Fei deprecated timelock burned
  expect(await contracts.rariInfraFeiTimelock.beneficiary()).to.equal(addresses.feiTimelockBurner1);

  // 3. Verify Rari Tribe deprecated timelock burned
  expect(await contracts.rariInfraTribeTimelock.beneficiary()).to.equal(addresses.tribeTimelockBurner1);

  // Verify Fuse multisig does not have any delegated TRIBE
  expect(await contracts.tribe.getCurrentVotes(addresses.fuseMultisig)).to.equal(0);

  // 4. Verify Fei Labs Tribe timelock burned
  expect(await contracts.feiLabsVestingTimelock.beneficiary()).to.equal(addresses.tribeTimelockBurner2);

  // 5. Verify Tribe minter set to zero address and inflation is the minimum of 0.01% (1 basis point)
  expect(await contracts.tribe.minter()).to.equal(ethers.constants.AddressZero);
  expect(await contracts.tribeMinter.annualMaxInflationBasisPoints()).to.equal(1);

  // 6. Verify can not queue on DAO timelock
  await verifyCanNotQueueProposals(contracts, addresses);
};

// Verify proposals can not be queued
const verifyCanNotQueueProposals = async (contracts: NamedContracts, addresses: NamedAddresses) => {
  const feiDAO = contracts.feiDAO;

  const targets = [feiDAO.address];
  const values = [0];
  const calldatas = [
    '0x70b0f660000000000000000000000000000000000000000000000000000000000000000a' // set voting delay 10
  ];
  const description: any[] = [];

  const treasurySigner = await getImpersonatedSigner(addresses.core);
  await forceEth(addresses.core);
  await contracts.tribe.connect(treasurySigner).delegate(addresses.guardianMultisig);
  const signer = await getImpersonatedSigner(addresses.guardianMultisig);

  // Propose
  // note ethers.js requires using this notation when two overloaded methods exist)
  // https://docs.ethers.io/v5/migration/web3/#migration-from-web3-js--contracts--overloaded-functions
  await feiDAO.connect(signer)['propose(address[],uint256[],bytes[],string)'](targets, values, calldatas, description);

  const pid = await feiDAO.hashProposal(targets, values, calldatas, ethers.utils.keccak256(description));

  await time.advanceBlock();

  // vote
  await feiDAO.connect(signer).castVote(pid, 1);

  // advance to end of voting period
  const endBlock = (await feiDAO.proposals(pid)).endBlock;
  await time.advanceBlockTo(endBlock.toNumber());

  expect(await contracts.feiDAO.state(pid)).to.equal(4); // SUCCEEDED state in ProposalState enum

  // Attempt to queue on the timelock through the Fei DAO
  // Queuing should fail as daoTimelockBurner is admin of timelock
  await expect(
    feiDAO['queue(address[],uint256[],bytes[],bytes32)'](
      targets,
      values,
      calldatas,
      ethers.utils.keccak256(description)
    )
  ).to.be.revertedWith('Timelock: Call must come from admin.');
};

export { deploy, setup, teardown, validate };
