import { PodFactory, PodAdminGateway, RoleBastion, Core } from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { forceEth } from '@test/integration/setup/utils';
import { TestEndtoEndCoordinator } from '../setup';
import { BigNumber } from 'ethers';
import { tribalCouncilMembers, MIN_TIMELOCK_DELAY } from '@protocol/optimisticGovernance';

const toBN = ethers.BigNumber.from;

describe('Tribal Council', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
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

  const dummyRole = ethers.utils.id('DUMMY_ROLE');

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
    await resetFork();
  });

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    // Set deploy address to Tom's address. This has Orca SHIP
    const deployAddress = '0x64c4Bffb220818F0f2ee6DAe7A2F17D92b359c5d';

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

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

    await forceEth(contractAddresses.tribalCouncilTimelock);
    await forceEth(contractAddresses.feiDAOTimelock);

    podConfig = {
      members: [
        '0x000000000000000000000000000000000000000D',
        '0x000000000000000000000000000000000000000E',
        '0x000000000000000000000000000000000000000F',
        '0x0000000000000000000000000000000000000010'
      ],
      threshold: 1,
      label: '0x54726962616c436f726e63696c00000000000000000000000000000000000000', // TribalCouncil
      ensString: 'testPod.eth',
      imageUrl: 'testPod.com',
      minDelay: MIN_TIMELOCK_DELAY,
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
    await podAdminGateway.connect(feiDAOTimelockSigner).unlockMembershipTransfers(tribalCouncilPodId);
    const isLocked = await podFactory.getIsMembershipTransferLocked(tribalCouncilPodId);
    expect(isLocked).to.be.false;
  });

  ///////////    TribalCouncil management of other pods  /////////////
  it('can create a child pod', async () => {
    const deployTx = await podFactory.connect(tribalCouncilTimelockSigner).createOptimisticPod(podConfig);
    const { args } = (await deployTx.wait()).events.find((elem) => elem.event === 'CreatePod');
    const podId = args.podId;
    const numPodMembers = await podFactory.getNumMembers(podId);
    expect(numPodMembers).to.equal(4);
  });

  it('can create a new role via the Role Bastion', async () => {
    await roleBastion.connect(tribalCouncilTimelockSigner).createRole(dummyRole);

    // Validate that the role was created with the admin set to ROLE_ADMIN
    const roleAdmin = await core.getRoleAdmin(dummyRole);
    expect(roleAdmin).to.equal(ethers.utils.id('ROLE_ADMIN'));
  });

  it('can authorise a pod timelock with a role', async () => {
    // Grant new role to the created pod timelock
    const podTimelock = await podFactory.getPodTimelock(tribalCouncilPodId);
    await core.connect(tribalCouncilTimelockSigner).grantRole(dummyRole, podTimelock);

    // Validate has role
    const hasRole = await core.hasRole(dummyRole, podTimelock);
    expect(hasRole).to.equal(true);
  });

  it('can revoke a role from a pod timelock', async () => {
    // Grant new role to the created pod timelock
    const podTimelock = await podFactory.getPodTimelock(tribalCouncilPodId);
    await core.connect(tribalCouncilTimelockSigner).grantRole(dummyRole, podTimelock);

    // Revoke role
    await core.connect(tribalCouncilTimelockSigner).revokeRole(dummyRole, podTimelock);

    // Validate does not have role
    const hasRole = await core.hasRole(dummyRole, podTimelock);
    expect(hasRole).to.equal(false);
  });
});
