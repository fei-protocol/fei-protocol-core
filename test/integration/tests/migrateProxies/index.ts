import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { resetFork, performDAOAction } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { fip_79aCalldata, fip_79bCalldata, fip_79cCalldata } from './proposalData';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '../../setup/utils';

const reduceDAOVotingPeriod = async (feiDAO: Contract, senderAddress: string) => {
  const calldatas = [
    '0x70b0f660000000000000000000000000000000000000000000000000000000000000000a' // set voting delay 10
  ];
  const targets = [feiDAO.address];
  const values = [0];
  await performDAOAction(feiDAO, senderAddress, calldatas, targets, values);
};

describe.only('Migrate proxies', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let feiDAO: Contract;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
    await resetFork();
  });

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    feiDAO = contracts.feiDAO;

    await forceEth(feiDAO.address);
    await reduceDAOVotingPeriod(feiDAO, contractAddresses.multisig);
  });

  it('should update FEI DAO timelock from oldTimelock to newTimelock (fip_79a)', async () => {
    // Multisig address has sufficient TRIBE to pass quorum
    const targets = [feiDAO.address];
    const values = [0];
    await performDAOAction(feiDAO, contractAddresses.multisig, fip_79aCalldata, targets, values);

    const daoTimelock = await feiDAO.timelock();
    expect(daoTimelock).to.equal(contractAddresses.timelock);
  });

  it('should migrate proxies from oldTimelock to newTimelock (fip_79b)', async () => {
    const values = [0, 0, 0, 0, 0];
    const targets = [
      contractAddresses.proxyAdmin,
      contractAddresses.proxyAdmin,
      contractAddresses.timelock,
      contractAddresses.timelock,
      contractAddresses.feiDAO
    ];
    await performDAOAction(feiDAO, contractAddresses.multisig, fip_79bCalldata, targets, values);

    const newTimelockAddress = contractAddresses.feiDAOTimelock;

    const aaveTribeIncentivesProxy = contracts.aaveTribeIncentivesControllerProxy;
    const aaveIncentiveAdmin = await aaveTribeIncentivesProxy.admin();
    expect(aaveIncentiveAdmin).to.equal(newTimelockAddress);

    const proxyAdmin = contracts.proxyAdmin;
    const proxyAdminOwner = await proxyAdmin.owner();
    expect(proxyAdminOwner).to.equal(newTimelockAddress);

    const oldTimelock = contracts.timelock;
    const oldTimelockDelay = await oldTimelock.delay();
    expect(oldTimelockDelay).to.equal(0);

    const oldTimelockPendingAdmin = await oldTimelock.pendingAdmin();
    expect(oldTimelockPendingAdmin).to.equal(newTimelockAddress);

    const feiDAOTimelock = await feiDAO.timelock();
    expect(feiDAOTimelock).to.equal(newTimelockAddress);
  });

  // it('should accept newTimelock as admin on oldTimelock', async () => {
  // const values = [0];
  // const targets = [contractAddresses.timelock];
  //   await performDAOAction(feiDAO, contractAddresses.multisig, fip_79cCalldata, targets, values);

  //   // Check admin of the oldTimelock is the newTimelock
  //   const oldTimelock = contracts.timelock;
  //   const oldTimelockAdmin = await oldTimelock.admin();
  //   expect(oldTimelockAdmin).to.equal(contractAddresses.feiDAOTimelock);
  // })
});
