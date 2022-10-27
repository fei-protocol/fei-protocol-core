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
import { BigNumber } from 'ethers';

/*

TIP_123

*/

let pcvStatsBefore: PcvStats;
let initialTotalTribeDelegation: BigNumber;

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
  const tribeTimelockBurner2 = await TribeTimelockedDelegatorBurnerFactory.deploy(
    addresses.tribeDAODelegationsTimelock
  );
  console.log('Tribe DAO delegations TRIBE burner deployed to: ', tribeTimelockBurner2.address);

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
  initialTotalTribeDelegation = await contracts.tribeDAODelegationsTimelock.totalDelegated();
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

  // 4. Verify Tribe DAO Delegations timelock burned
  expect(await contracts.tribeDAODelegationsTimelock.beneficiary()).to.equal(addresses.tribeTimelockBurner2);

  // 5. Verify Tribe minter set to zero address and inflation is the minimum of 0.01% (1 basis point)
  expect(await contracts.tribe.minter()).to.equal(ethers.constants.AddressZero);
  expect(await contracts.tribeMinter.annualMaxInflationBasisPoints()).to.equal(1);

  // 6. Verify can not queue on DAO timelock
  await verifyCanNotQueueProposals(contracts, addresses);

  // 7. Verify proxyAdmin ownership renounced
  expect(await contracts.proxyAdmin.owner()).to.equal(ethers.constants.AddressZero);

  // 8. Verify can permissionlessly undelegated TRIBE from timelock via TRIBE timelock burner
  const delegatee = '0x0d4ba14ca1e990654c6f9c7957b9b23f8a1429dc';
  const expectedDelegateeDelegation = ethers.constants.WeiPerEther.mul(1_000_000);
  expect(await contracts.tribeDAODelegationsTimelock.delegateAmount(delegatee)).to.equal(expectedDelegateeDelegation);

  await contracts.tribeTimelockBurner2.undelegate(delegatee);

  const finalTribeDelegated = await contracts.tribeDAODelegationsTimelock.totalDelegated();
  const undelegatedAmount = initialTotalTribeDelegation.sub(finalTribeDelegated);

  // Verify delegatee no longer has a delegation
  expect(await contracts.tribeDAODelegationsTimelock.delegateAmount(delegatee)).to.equal(0);

  // Verify total delegation decrease was equal to the delegates delegation
  expect(undelegatedAmount).to.equal(expectedDelegateeDelegation);

  // 9. Verify can permissionlessly burn FEI on Rari infra burner timelock
  const initialFeiSupply = await contracts.fei.totalSupply();
  const initialRariTimelockFei = await contracts.fei.balanceOf(addresses.rariInfraFeiTimelock);
  await contracts.feiTimelockBurner1.burnFeiHeld();
  const feiBurned = initialFeiSupply.sub(await contracts.fei.totalSupply());
  const rariTimelockFeiLoss = initialRariTimelockFei.sub(await contracts.fei.balanceOf(addresses.rariInfraFeiTimelock));
  expect(feiBurned).to.equal(rariTimelockFeiLoss);

  // 10. Verify can permissionlessly sendTribeToTreasury() on Rari infra Tribe burner timelock
  const initialCoreTreasury1 = await contracts.tribe.balanceOf(addresses.core);
  const initialRariTimelockTribe1 = await contracts.tribe.balanceOf(addresses.rariInfraTribeTimelock);
  await contracts.tribeTimelockBurner1.sendTribeToTreaury();
  const rariTimelockTribeLoss1 = initialRariTimelockTribe1.sub(
    await contracts.tribe.balanceOf(addresses.rariInfraTribeTimelock)
  );
  const coreTreasuryGain1 = (await contracts.tribe.balanceOf(addresses.core)).sub(initialCoreTreasury1);
  expect(coreTreasuryGain1).to.equal(rariTimelockTribeLoss1);

  // 11. Verify can permissionlessly sendTribeToTreasury() on Tribe DAO delegations burner timelock
  // Undelegate TRIBE to make available
  await contracts.tribeTimelockBurner2.undelegate('0xd046135ba00b0315ed4c3135206c87a7f4eb57d9');
  await contracts.tribeTimelockBurner2.undelegate('0xc64ed730e030bdcb66e9b5703798bb4275a5a484');
  await contracts.tribeTimelockBurner2.undelegate('0x114b8d7ab033e650003fa3fc72c5ba2d0fd18345');

  const initialCoreTreasury2 = await contracts.tribe.balanceOf(addresses.core);
  const initialDAOTimelockTribe2 = await contracts.tribe.balanceOf(addresses.tribeDAODelegationsTimelock);
  await contracts.tribeTimelockBurner2.sendTribeToTreaury();
  const daoTimelockTribeLoss2 = initialDAOTimelockTribe2.sub(
    await contracts.tribe.balanceOf(addresses.tribeDAODelegationsTimelock)
  );
  const coreTreasuryGain2 = (await contracts.tribe.balanceOf(addresses.core)).sub(initialCoreTreasury2);
  expect(coreTreasuryGain2).to.equal(daoTimelockTribeLoss2);
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
