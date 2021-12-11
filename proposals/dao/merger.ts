import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  MainnetContracts,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { PegExchanger, Timelock, TRIBERagequit } from '@custom-types/contracts';
import { getImpersonatedSigner } from '@test/helpers';
import rariMergerProposal from '@proposals/description/mergerRari';
import constructProposal from '@scripts/utils/constructProposal';

chai.use(CBN(ethers.BigNumber));

/*
PCV Guardian

DEPLOY ACTIONS:

1. Deploy TribeRariDAO
2. Deploy PegExchanger
3. Deploy TribeRagequit

*/

const merkleRoot = '0x417b302928c3bee7e6818f2b06f3fd62dad4676747d87e81a8e25ef81d3cbad3';

const rageQuitStart = '1640221200'; // Dec 23, 1am UTC
const rageQuitDeadline = '1640480400'; // Dec 26, 1am UTC
const equity = '792326034963459120910718196';

const toBN = ethers.BigNumber.from;

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { tribe, rariTimelock } = addresses;

  if (!tribe || !rariTimelock) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1. Deploy TribeRariDAO
  const factory = await ethers.getContractFactory('FeiDAO');
  const tribeRariDAO = await factory.deploy(tribe, rariTimelock, ethers.constants.AddressZero);

  await tribeRariDAO.deployTransaction.wait();

  logging && console.log('tribeRariDAO: ', tribeRariDAO.address);

  // 2. Deploy PegExchanger
  const pegFactory = await ethers.getContractFactory('PegExchanger');
  const pegExchanger = await pegFactory.deploy(tribeRariDAO.address);

  await pegExchanger.deployTransaction.wait();

  logging && console.log('pegExchanger: ', pegExchanger.address);

  // 3. Deploy TribeRagequit
  const ragequitFactory = await ethers.getContractFactory('TRIBERagequit');
  const tribeRagequit = await ragequitFactory.deploy(merkleRoot, rageQuitStart, rageQuitDeadline, tribeRariDAO.address);

  await tribeRagequit.deployTransaction.wait();

  logging && console.log('tribeRagequit: ', tribeRagequit.address);

  return {
    tribeRariDAO,
    pegExchanger,
    tribeRagequit
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Setup');
  const guardian = addresses.multisig;
  const tribeRagequit: TRIBERagequit = contracts.tribeRagequit as TRIBERagequit;

  const signer = await getImpersonatedSigner(guardian);

  await tribeRagequit.connect(signer).setExchangeRate(equity);
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Teardown');
  const proposal = await constructProposal(
    rariMergerProposal,
    contracts as unknown as MainnetContracts,
    addresses,
    logging
  );

  const timelock: Timelock = (await contracts.rariTimelock) as Timelock;

  await proposal.setGovernor(await timelock.admin());

  logging && console.log(`Simulating proposal...`);
  await proposal.simulate();

  const tribeRagequit: TRIBERagequit = contracts.tribeRagequit as TRIBERagequit;
  const pegExchanger: PegExchanger = contracts.pegExchanger as PegExchanger;
  await tribeRagequit.setBothPartiesAccepted();
  await pegExchanger.setBothPartiesAccepted();
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const tribeRagequit: TRIBERagequit = contracts.tribeRagequit as TRIBERagequit;
  const pegExchanger: PegExchanger = contracts.pegExchanger as PegExchanger;
  const { tribe, fei } = contracts;

  expect(await tribeRagequit.bothPartiesAccepted()).to.be.true;
  expect(await pegExchanger.bothPartiesAccepted()).to.be.true;

  expect((await tribeRagequit.intrinsicValueExchangeRateBase()).toString()).to.be.equal('1237113801');
  expect((await tribe.balanceOf(pegExchanger.address)).toString()).to.be.equal('270000000000000000000000000');
  expect((await fei.balanceOf(addresses.gfxAddress)).toString()).to.be.equal('315909060000000000000000');

  expect((await tribeRagequit.rageQuitStart()).toString()).to.be.equal(rageQuitStart);
  expect((await tribeRagequit.rageQuitEnd()).toString()).to.be.equal(rageQuitDeadline);
  expect(await tribeRagequit.merkleRoot()).to.be.equal(merkleRoot);
};
