import { PodAdminGateway, PodFactory } from '@custom-types/contracts';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import Safe from '@gnosis.pm/safe-core-sdk';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MIN_TIMELOCK_DELAY, TRIBAL_COUNCIL_POD_ID, tribeCouncilPodConfig } from '@protocol/optimisticGovernance';
import proposals from '@protocol/proposalsConfig';
import { getImpersonatedSigner, initialiseGnosisSDK, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumberish, Contract } from 'ethers';
import { ethers } from 'hardhat';
import { abi as timelockABI } from '../../../artifacts/@openzeppelin/contracts/governance/TimelockController.sol/TimelockController.json';
import { TestEndtoEndCoordinator } from '../setup';

function createSafeTxArgs(timelock: Contract, functionSig: string, args: any[]) {
  return {
    to: timelock.address, // Send to timelock, calling timelock.schedule()
    data: timelock.interface.encodeFunctionData(functionSig, args),
    value: '0'
  };
}

describe('Pod operation and veto', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let podFactory: PodFactory;
  let tribalCouncilTimelockSigner: SignerWithAddress;
  let podConfig: any;
  let podId: BigNumberish;
  let timelockAddress: string;
  let podTimelock: Contract;
  let registryTxData: string;
  let safeSDK: Safe;

  const proposalId = '1234';
  const proposalMetadata = 'FIP_XX: This tests that the governance upgrade flow works';

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
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
    const podAdminGateway = contracts.podAdminGateway as PodAdminGateway;
    tribalCouncilTimelockSigner = await getImpersonatedSigner(contractAddresses.tribalCouncilTimelock);

    await forceEth(contractAddresses.tribalCouncilTimelock);
    await forceEth(contractAddresses.feiDAOTimelock);
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

    // Test Fixture:
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
    const deployTx = await podFactory.connect(tribalCouncilTimelockSigner).createOptimisticPod(podConfig);
    const { args } = (await deployTx.wait()).events.find((elem) => elem.event === 'CreatePod');

    podId = args.podId;
    const safeAddress = await podFactory.getPodSafe(podId);
    timelockAddress = await podFactory.getPodTimelock(podId);
    const podMemberSigner = await getImpersonatedSigner(podConfig.members[0]);

    // 2.0 Instantiate Gnosis SDK
    podTimelock = new ethers.Contract(timelockAddress, timelockABI, podMemberSigner);
    safeSDK = await initialiseGnosisSDK(podMemberSigner, safeAddress);

    // 3. TribalCouncil authorises pod with POD_METADATA_REGISTER_ROLE role
    await contracts.core
      .connect(tribalCouncilTimelockSigner)
      .grantRole(ethers.utils.id('POD_METADATA_REGISTER_ROLE'), timelockAddress);

    // 3.0 Create transaction on Safe. Threshold set to 1 on pod
    //     - create a proposal that targets the Safe's timelock
    //     - include in the proposal tx data that will then target a part of the protocol
    registryTxData = contracts.governanceMetadataRegistry.interface.encodeFunctionData('registerProposal', [
      podId,
      proposalId,
      proposalMetadata
    ]);

    // Grant the Pod Safe and timelock eth
    await forceEth(safeAddress);
    await forceEth(timelockAddress);

    const txArgs = createSafeTxArgs(podTimelock, 'schedule', [
      contractAddresses.governanceMetadataRegistry,
      0,
      registryTxData,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      podConfig.minDelay
    ]);

    const safeTransaction = await safeSDK.createTransaction(txArgs);

    // 3.0 Execute transaction on Safe
    const executeTxResponse = await safeSDK.executeTransaction(safeTransaction);
    await executeTxResponse.transactionResponse?.wait();
  });

  it('should allow a proposal to be proposed and executed', async () => {
    // Fast forward time on timelock
    await time.increase(podConfig.minDelay);

    // Execute timelocked transaction - need to call via the podExecutor
    const podExecutor = contracts.podExecutor;
    const executeTx = await podExecutor.execute(
      timelockAddress,
      contractAddresses.governanceMetadataRegistry,
      0,
      registryTxData,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000001'
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

  it('should allow the nopeDAO to veto a proposal through the pod', async () => {
    const proposalId2 = '4321';
    const registryTxData2 = contracts.governanceMetadataRegistry.interface.encodeFunctionData('registerProposal', [
      podId,
      proposalId2,
      proposalMetadata
    ]);
    const txArgs2 = createSafeTxArgs(podTimelock, 'schedule', [
      contractAddresses.governanceMetadataRegistry,
      0,
      registryTxData2,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      podConfig.minDelay
    ]);
    const safeTransaction2 = await safeSDK.createTransaction(txArgs2);
    const executeTxResponse2 = await safeSDK.executeTransaction(safeTransaction2);
    await executeTxResponse2.transactionResponse?.wait();

    // 1. Create proposal on the NopeDAO to veto. This proposal needs to
    //    call the podAdminGateway.veto() method with the proposalId that is in the timelock
    // 2. Have a member with >quorum TRIBE vote for proposal
    // 3. Validate that proposal is executed
    const userWithTribe = await getImpersonatedSigner(contractAddresses.multisig);
    const timelockProposalId = await podTimelock.hashOperation(
      contractAddresses.governanceMetadataRegistry,
      0,
      registryTxData2,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    );

    // User proposes on NopeDAO
    const nopeDAO = contracts.nopeDAO;
    const description = 'Veto proposal';
    const calldatas = [contracts.podAdminGateway.interface.encodeFunctionData('veto', [podId, timelockProposalId])];
    const targets = [contractAddresses.podAdminGateway];
    const values = [0];

    const proposeTx = await nopeDAO.propose(targets, values, calldatas, description);
    const { args } = (await proposeTx.wait()).events.find((elem) => elem.event === 'ProposalCreated');
    const nopeDAOProposalId = args.proposalId;

    // Use the proposalID to vote for this proposal on the nopeDAO
    await nopeDAO.connect(userWithTribe).castVote(nopeDAOProposalId, 1);

    const descriptionHash = ethers.utils.id(description);
    await nopeDAO.execute(targets, values, calldatas, descriptionHash);

    // Validate proposal was nope'd
    const readyTimestamp = await podTimelock.getTimestamp(timelockProposalId);
    expect(readyTimestamp).to.equal(0);
  });

  it('should allow TribalCouncil to operate on the protocol', async () => {
    // 1. Get Gnosis SDK connections for each TC member
    const tribalCouncilTimelock = contracts.tribalCouncilTimelock;
    const tribalCouncilSafeSigner = await getImpersonatedSigner(contractAddresses.tribalCouncilSafe);
    await forceEth(tribalCouncilTimelock.address);
    await forceEth(contractAddresses.tribalCouncilSafe);

    const tribalCouncilMinDelay = await tribalCouncilTimelock.getMinDelay();
    expect(tribalCouncilMinDelay).to.be.equal(tribeCouncilPodConfig.minDelay);

    // 2. Prepare a proposal which requires a TribeRole. TribalCouncil timelock should have been granted
    // ROLE_ADMIN and be able to call into RoleBastion to create a role
    const dummyRole = ethers.utils.id('DUMMY_2_ROLE');
    const registryTCData = contracts.roleBastion.interface.encodeFunctionData('createRole', [dummyRole]);
    await tribalCouncilTimelock
      .connect(tribalCouncilSafeSigner)
      .schedule(
        contractAddresses.roleBastion,
        0,
        registryTCData,
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        tribeCouncilPodConfig.minDelay
      );

    // 5. Execute timelocked transaction - need to call via the podExecutor
    // Fast forward time on timelock
    await time.increase(tribeCouncilPodConfig.minDelay);

    const podExecutor = contracts.podExecutor;
    const executeTx = await podExecutor.execute(
      tribalCouncilTimelock.address,
      contractAddresses.roleBastion,
      0,
      registryTCData,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    );
    await executeTx.wait();

    // 6.0 Validate that the expected role was created in core, should have a ROLE_ADMIN admin
    const dummyRoleAdmin = await contracts.core.getRoleAdmin(dummyRole);
    expect(dummyRoleAdmin).to.be.equal(ethers.utils.id('ROLE_ADMIN'));
  });

  it('should allow deployed NopeDAO to veto a TribalCouncil proposal', async () => {
    // 1. Get Gnosis SDK connections for each TC member
    const tribalCouncilTimelock = contracts.tribalCouncilTimelock;
    const tribalCouncilSafeSigner = await getImpersonatedSigner(contractAddresses.tribalCouncilSafe);
    await forceEth(tribalCouncilTimelock.address);
    await forceEth(contractAddresses.tribalCouncilSafe);

    const tribalCouncilMinDelay = await tribalCouncilTimelock.getMinDelay();
    expect(tribalCouncilMinDelay).to.be.equal(tribeCouncilPodConfig.minDelay);

    // 2. Prepare a proposal which requires a TribeRole. TribalCouncil timelock should have been granted
    // ROLE_ADMIN and be able to call into RoleBastion to create a role
    const dummyRole = ethers.utils.id('DUMMY_ROLE');
    const roleCreationData = contracts.roleBastion.interface.encodeFunctionData('createRole', [dummyRole]);
    await tribalCouncilTimelock
      .connect(tribalCouncilSafeSigner)
      .schedule(
        contractAddresses.roleBastion,
        0,
        roleCreationData,
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        tribeCouncilPodConfig.minDelay
      );

    // 3. Create NopeDAO proposal to veto the timelocked transaction
    const userWithTribe = await getImpersonatedSigner(contractAddresses.multisig);
    const timelockProposalId = await tribalCouncilTimelock.hashOperation(
      contractAddresses.roleBastion,
      0,
      roleCreationData,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    );

    // User proposes on NopeDAO
    const nopeDAO = contracts.nopeDAO;
    const description = 'Veto proposal';
    const calldatas = [
      contracts.podAdminGateway.interface.encodeFunctionData('veto', [TRIBAL_COUNCIL_POD_ID, timelockProposalId])
    ];
    const targets = [contractAddresses.podAdminGateway];
    const values = [0];

    const proposeTx = await nopeDAO.propose(targets, values, calldatas, description);
    const { args } = (await proposeTx.wait()).events.find((elem) => elem.event === 'ProposalCreated');
    const nopeDAOProposalId = args.proposalId;

    // Use the proposalID to vote for this proposal on the nopeDAO
    await nopeDAO.connect(userWithTribe).castVote(nopeDAOProposalId, 1);

    const descriptionHash = ethers.utils.id(description);
    await nopeDAO.execute(targets, values, calldatas, descriptionHash);

    // Validate proposal was nope'd
    const readyTimestamp = await tribalCouncilTimelock.getTimestamp(timelockProposalId);
    expect(readyTimestamp).to.equal(0);
  });

  it('should not allow non-Safe to queue on TribalCouncil timelock', async () => {
    const attackerAddress = '0xFBbbedc28217550fa63ACA29e85b87c2646e11d4';
    const attackerSigner = await getImpersonatedSigner(attackerAddress);

    const tribalCouncilTimelock = contracts.tribalCouncilTimelock;
    await forceEth(tribalCouncilTimelock.address);
    await forceEth(attackerAddress);

    // 2. Prepare a proposal which requires a TribeRole. TribalCouncil timelock should have been granted
    // ROLE_ADMIN and be able to call into RoleBastion to create a role
    const dummyRole = ethers.utils.id('DUMMY_3_ROLE');
    const roleCreationData = contracts.roleBastion.interface.encodeFunctionData('createRole', [dummyRole]);
    await expect(
      tribalCouncilTimelock
        .connect(attackerSigner)
        .schedule(
          contractAddresses.roleBastion,
          0,
          roleCreationData,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          tribeCouncilPodConfig.minDelay
        )
    ).to.be.revertedWith(
      'AccessControl: account 0xfbbbedc28217550fa63aca29e85b87c2646e11d4 is missing role 0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1'
    );
  });
});
