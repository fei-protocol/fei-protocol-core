import hre from 'hardhat';
import { PodFactory, PodAdminGateway, RoleBastion, Core } from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { BigNumber } from 'ethers';
import { tribalCouncilMembers } from '@protocol/optimisticGovernance';

const toBN = ethers.BigNumber.from;

async function createFixture(): Promise<number> {
  // evm_snapshot takes a snapshot of blockchain state
  return hre.network.provider.send('evm_snapshot', []);
}

async function useFixture(snapshotId: string): Promise<number> {
  // evm_revert reverts to a snapshot id
  await hre.network.provider.send('evm_revert', [snapshotId]);
  // sets chain state up to mirror deployment

  // Recreate snapshot
  const newSnapshotId = await hre.network.provider.send('evm_snapshot', []);
  return newSnapshotId;
}

describe.only('Tribal Council', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: SignerWithAddress;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let podFactory: PodFactory;
  let podAdminGateway: PodAdminGateway;
  let core: Core;
  let roleBastion: RoleBastion;
  let tribalCouncilPodId: BigNumber;
  let feiDAOTimelockSigner: SignerWithAddress;
  let tribalCouncilTimelockSigner: SignerWithAddress;
  let podConfig: any;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
    await resetFork();
  });

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0];
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress.address,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    // const newSnapshotId = await useFixture('0x130');
    // console.log({ newSnapshotId });

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    podFactory = contracts.podFactory as PodFactory;
    podAdminGateway = contracts.podAdminGateway as PodAdminGateway;
    core = contracts.core as Core;
    roleBastion = contracts.roleBastion as RoleBastion;

    tribalCouncilPodId = await podFactory.getPodId(contractAddresses.tribalCouncilTimelock);

    feiDAOTimelockSigner = await getImpersonatedSigner(contractAddresses.feiDAOTimelock);
    tribalCouncilTimelockSigner = await getImpersonatedSigner(contractAddresses.tribalCouncilTimelock);

    // const snapshotId = await createFixture();
    // console.log({ snapshotId });

    podConfig = {
      members: [
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000003',
        '0x0000000000000000000000000000000000000004'
      ],
      threshold: 2,
      label: '0x47282', // TribalCouncil
      ensString: 'testPod.eth',
      imageUrl: 'testPod.com',
      minDelay: 86400,
      numMembers: 4,
      admin: podAdminGateway.address
    };
  });

  ///////////////   DAO management of Tribal Council  //////////////
  it('should allow DAO to add members', async () => {
    const initialNumPodMembers = await podFactory.getNumMembers(tribalCouncilPodId);

    const newMember = '0x0000000000000000000000000000000000000030';
    await podAdminGateway.connect(feiDAOTimelockSigner).addPodMember(tribalCouncilPodId, newMember);

    const numPodMembers = await podFactory.getNumMembers(tribalCouncilPodId);
    await expect(numPodMembers).to.equal(initialNumPodMembers.add(toBN(1)));

    const podMembers = await podFactory.getPodMembers(tribalCouncilPodId);
    expect(podMembers[0]).to.equal(newMember);
  });

  it('should allow DAO to remove members', async () => {
    const initialNumPodMembers = await podFactory.getNumMembers(tribalCouncilPodId);

    const memberToBurn = tribalCouncilMembers[0];
    await podAdminGateway.connect(feiDAOTimelockSigner).removePodMember(tribalCouncilPodId, memberToBurn);

    const numPodMembers = await podFactory.getNumMembers(tribalCouncilPodId);
    await expect(numPodMembers).to.equal(initialNumPodMembers.sub(toBN(1)));

    const podMembers = await podFactory.getPodMembers(tribalCouncilPodId);
    expect(!podMembers.includes(memberToBurn)).to.be.true;
  });

  it('should be able to toggle membership transfers', async () => {
    // Waiting for membership transfer lock PR
    // await podAdminGateway.connect(feiDAOTimelockSigner).lockMembershipTransfer(tribalCouncilPodId);
    // const isLocked = await podAdminGateway.isMembershipTransferLocked(tribalCouncilPodId);
    // expect(isLocked).to.be.true;
  });

  ///////////    TribalCouncil management of other pods  /////////////
  it('can create a child pod', async () => {
    await podFactory.connect(tribalCouncilTimelockSigner).createChildOptimisticPod(podConfig);
    const podId = await podFactory.latestPodId();
    const numPodMembers = await podFactory.getNumMembers(podId);
    expect(numPodMembers).to.equal(4);
  });

  it('can create a new role via the Role Bastion', async () => {
    const dummyRole = ethers.utils.id('DUMMY_ROLE');
    await roleBastion.connect(tribalCouncilTimelockSigner).createRole(dummyRole);

    // Validate that the role was created ROLE_ADMIN role
    const roleAdmin = await core.getRoleAdmin(dummyRole);
    expect(roleAdmin).to.equal(ethers.utils.id('ROLE_ADMIN'));
  });

  it('can authorise a pod timelock with a role', async () => {
    const dummyRole = ethers.utils.id('DUMMY_ROLE');
    await roleBastion.connect(tribalCouncilTimelockSigner).createRole(dummyRole);

    // Grant new role to the created pod timelock
    const podTimelock = await podFactory.getPodTimelock(tribalCouncilPodId);
    await core.connect(tribalCouncilTimelockSigner).grantRole(dummyRole, podTimelock);

    // Validate has role
    const hasRole = await core.hasRole(dummyRole, podTimelock);
    expect(hasRole).to.equal(true);
  });

  it('can revoke a role from a pod timelock', async () => {
    const dummyRole = ethers.utils.id('DUMMY_ROLE');
    await roleBastion.connect(tribalCouncilTimelockSigner).createRole(dummyRole);

    // Grant new role to the created pod timelock
    const podTimelock = await podFactory.getPodTimelock(tribalCouncilPodId);
    await core.connect(tribalCouncilTimelockSigner).grantRole(dummyRole, podTimelock);

    // Revoke role
    await core.connect(tribalCouncilTimelockSigner).revokeRole(dummyRole, podTimelock);

    // Validate does not have role
    const hasRole = await core.hasRole(dummyRole, podTimelock);
    expect(hasRole).to.equal(false);
  });

  // ////////   TribalCouncil pod execution  //////////////
  // it('should allow a proposal to be proposed and executed', async () => {
  // TODO
  // });

  // it('should allow TribalCouncil to veto a proposal through the pod', async () => {

  // })

  ////////////  NopeDAO veto   ///////////////
  // it('should allow the nopeDAO to veto a proposal through the pod', async () => {

  // })
});
