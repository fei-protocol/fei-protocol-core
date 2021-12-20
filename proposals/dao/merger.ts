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
import { execProposal } from '@scripts/utils/exec';
import { createTree } from '@scripts/utils/merkle';
import { forceEth } from '@test/integration/setup/utils';

chai.use(CBN(ethers.BigNumber));

/*
PCV Guardian

DEPLOY ACTIONS:

1. Deploy TribeRariDAO
2. Deploy PegExchanger
3. Deploy TribeRagequit
4. Deploy MergerGate
5. Deploy PegExchangerDripper
*/

const tree = createTree();
const root = tree.getRoot().toString('hex');

const merkleRoot = '0x8c1f858b87b4e23cb426875833bf8f1aaeb627fe2f47e62385d704c415d652dc';

const rageQuitStart = '1640221200'; // Dec 23, 1am UTC
const rageQuitDeadline = '1640480400'; // Dec 26, 1am UTC
const equity = '692588388367337720822976255';

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

  // 4. Deploy MergerGate
  const gateFactory = await ethers.getContractFactory('MergerGate');
  const mergerGate = await gateFactory.deploy();

  await mergerGate.deployTransaction.wait();

  logging && console.log('mergerGate: ', mergerGate.address);

  // 5. Deploy PegExchangerDripper
  const dripperFactory = await ethers.getContractFactory('PegExchangerDripper');
  const pegExchangerDripper = await dripperFactory.deploy();

  await pegExchangerDripper.deployTransaction.wait();

  logging && console.log('pegExchangerDripper: ', pegExchangerDripper.address);

  return {
    tribeRariDAO,
    pegExchanger,
    tribeRagequit,
    mergerGate,
    pegExchangerDripper
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Setup');
  const guardian = addresses.multisig;
  const tribeRagequit: TRIBERagequit = contracts.tribeRagequit as TRIBERagequit;

  const signer = await getImpersonatedSigner(guardian);

  if ((await tribeRagequit.intrinsicValueExchangeRateBase()).toString() === '0') {
    await tribeRagequit.connect(signer).setExchangeRate(equity);
  }

  const rgt = contracts.rgt;
  await forceEth(addresses.rariTimelock);

  const rariSigner = await getImpersonatedSigner(addresses.rariTimelock);

  await rgt.connect(rariSigner).delegate(addresses.rariTimelock);

  await execProposal(addresses.rariTimelock, await contracts.rariTimelock.admin(), '0', '9');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Teardown');

  const tribeRagequit: TRIBERagequit = contracts.tribeRagequit as TRIBERagequit;
  const pegExchanger: PegExchanger = contracts.pegExchanger as PegExchanger;
  await tribeRagequit.setBothPartiesAccepted();
  await pegExchanger.setBothPartiesAccepted();
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const tribeRagequit: TRIBERagequit = contracts.tribeRagequit as TRIBERagequit;
  const pegExchanger: PegExchanger = contracts.pegExchanger as PegExchanger;
  const { tribe, fei, rariTimelock } = contracts;

  expect(await rariTimelock.admin()).to.be.equal(addresses.tribeRariDAO);

  expect(await tribeRagequit.bothPartiesAccepted()).to.be.true;
  expect(await pegExchanger.bothPartiesAccepted()).to.be.true;

  expect((await tribeRagequit.intrinsicValueExchangeRateBase()).toString()).to.be.equal('1078903938');
  expect((await tribe.balanceOf(addresses.pegExchangerDripper)).toString()).to.be.equal('170000000000000000000000000');
  expect((await tribe.balanceOf(addresses.pegExchanger)).toString()).to.be.equal('100000000000000000000000000');

  expect((await fei.balanceOf(addresses.gfxAddress)).toString()).to.be.equal('315909060000000000000000');

  expect(await contracts.pegExchangerDripper.isEligible()).to.be.false;

  expect((await tribeRagequit.rageQuitStart()).toString()).to.be.equal(rageQuitStart);
  expect((await tribeRagequit.rageQuitEnd()).toString()).to.be.equal(rageQuitDeadline);
  expect(await tribeRagequit.merkleRoot()).to.be.equal(`0x${root}`);
};
