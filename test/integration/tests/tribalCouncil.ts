import { PodFactory, PodAdminGateway, RoleBastion, Core } from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { forceEth } from '@test/integration/setup/utils';
import { TestEndtoEndCoordinator } from '../setup';
import { BigNumber, Contract } from 'ethers';
import { tribalCouncilMembers } from '@protocol/optimisticGovernance';
import { abi as gnosisSafeABI } from '../../../artifacts/contracts/pods/interfaces/IGnosisSafe.sol/IGnosisSafe.json';
import { abi as timelockABI } from '../../../artifacts/contracts/dao/timelock/OptimisticTimelock.sol/OptimisticTimelock.json';
import GnosisSDK from '@gnosis.pm/safe-core-sdk';

const EthersSafeSDK = GnosisSDK;
const toBN = ethers.BigNumber.from;

function createSafeTxArgs(timelock: Contract, functionSig: string, args: string[]) {
  return {
    to: timelock.address, // Send to timelock, calling timelock.schedule()
    data: timelock.interface.encodeFunctionData(functionSig, args),
    value: '0'
  };
}

describe('Tribal Council', function () {
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

  const dummyRole = ethers.utils.id('DUMMY_ROLE');

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
      minDelay: 2,
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
    await podFactory.connect(tribalCouncilTimelockSigner).createChildOptimisticPod(podConfig);
    const podId = await podFactory.latestPodId();
    const numPodMembers = await podFactory.getNumMembers(podId);
    expect(numPodMembers).to.equal(4);
  });

  it('can create a new role via the Role Bastion', async () => {
    await roleBastion.connect(tribalCouncilTimelockSigner).createRole(dummyRole);

    // Validate that the role was created ROLE_ADMIN role
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

  // ////////   TribalCouncil pod execution  //////////////
  it.only('should allow a proposal to be proposed and executed', async () => {
    // Test structure:
    //   - Deploys a pod
    //   - Has the TribalCouncil grant that pod timelock a role to interact with the
    //     protocol
    //   - Creates a proposal on the pod Safe
    //   - Executes the proposal and sends it to the pod's timelock
    //   - Fast forwards time and executes the timelocked proposal
    //   - Verifies that intended protocol action was taken
    //
    // The role and protocol action is that the POD_METADATA_REGISTER_ROLE role is being granted
    // and the pod is calling to register a proposal on the `GovernanceMetadataRegistry.sol`

    // 1. Deploy a pod through which a proposal will be executed
    await podFactory.connect(tribalCouncilTimelockSigner).createChildOptimisticPod(podConfig);
    const podId = await podFactory.latestPodId();
    const safeAddress = await podFactory.getPodSafe(podId);
    const timelockAddress = await podFactory.getPodTimelock(podId);

    const podMemberSigner = await getImpersonatedSigner('0x000000000000000000000000000000000000000D');
    console.log('safe address: ', safeAddress);

    // 2.0 Instantiate Gnosis SDK
    const podSafe = new ethers.Contract(safeAddress, gnosisSafeABI, podMemberSigner);
    const podTimelock = new ethers.Contract(timelockAddress, timelockABI, podMemberSigner);
    console.log({ podTimelock });

    console.log('setting up safeSDK');
    const safeSDK = await EthersSafeSDK.create({
      ethers: ethers as unknown as any,
      safeAddress: safeAddress,
      providerOrSigner: podMemberSigner,
      // configure for Mainnet, as e2e runs on forked Mainnet
      contractNetworks: {
        ['1']: {
          multiSendAddress: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761'
        }
      }
    });
    console.log({ safeSDK });

    // 3. TribalCouncil authorise pod with POD_METADATA_REGISTER_ROLE role
    await contracts.core
      .connect(tribalCouncilTimelockSigner)
      .grantRole(ethers.utils.id('POD_METADATA_REGISTER_ROLE'), timelockAddress);
    console.log('granted POD_METADATA_REGISTER_ROLE role');

    // 3.0 Create transaction on Safe. Threshold set to 1 on pod
    //     - create a proposal that targets the Safe's timelock
    //     - include in the proposal tx data that will then target a part of the protocol
    const proposalId = '1234';
    const proposalMetadata = 'FIP_XX: This tests that the governance upgrade flow works';
    const registryTxData = contracts.governanceMetadataRegistry.interface.encodeFunctionData('registerProposal', [
      podId,
      proposalId,
      proposalMetadata
    ]);
    console.log({ registryTxData });
    const txArgs = createSafeTxArgs(podTimelock, 'schedule', [
      contractAddresses.governanceMetadataRegistry,
      '0',
      registryTxData,
      '0',
      '0x1',
      '0'
    ]);
    console.log({ txArgs });
    const safeTransaction = await safeSDK.createTransaction(txArgs);
    console.log({ safeTransaction });

    // 3.0 Execute transaction on Safe
    const tx = await safeSDK.executeTransaction(safeTransaction);
    await tx.wait();

    // 4.0 Fast forward time on timelock
    await time.increase(toBN(5));

    // 5.0 Execute timelocked transaction - need to call via the podExecutor
    const podExecutor = contracts.podExecutor;
    const executeTx = await podExecutor.execute(
      timelockAddress,
      contractAddresses.governanceMetadataRegistry,
      '0',
      registryTxData,
      '0',
      '0x1',
      '0'
    );
    await executeTx.wait();

    // 6.0 Validate that proposal was executed, verify mock proposal registered
    const isRegistered = await contracts.governanceMetadataRegistry.isProposalRegistered(
      podId,
      proposalId,
      proposalMetadata
    );
    expect(isRegistered).to.equal(true);
  });

  ////////////  NopeDAO veto   ///////////////
  // it('should allow the nopeDAO to veto a proposal through the pod', async () => {
  // TODO: Setup a transaction as above, for proposal creation but call
  // await podAdminGateway.veto(podId, proposalId)
  // })
});
