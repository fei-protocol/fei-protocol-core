import { PodFactory } from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, resetFork, time, initialiseGnosisSDK } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { forceEth } from '@test/integration/setup/utils';
import { TestEndtoEndCoordinator } from '../setup';
import { BigNumberish, Contract } from 'ethers';
import { abi as timelockABI } from '../../../artifacts/@openzeppelin/contracts/governance/TimelockController.sol/TimelockController.json';
import { MIN_TIMELOCK_DELAY } from '@protocol/optimisticGovernance';

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
  let deployAddress: SignerWithAddress;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let podFactory: PodFactory;
  let tribalCouncilTimelockSigner: SignerWithAddress;
  let podConfig: any;
  let podId: BigNumberish;
  let timelockAddress: string;
  let podTimelock: Contract;
  let registryTxData: string;

  const proposalId = '1234';
  const proposalMetadata = 'FIP_XX: This tests that the governance upgrade flow works';

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
    await resetFork();
  });

  beforeEach(async function () {
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
      numMembers: 4
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
    await podFactory.connect(tribalCouncilTimelockSigner).createOptimisticPod(podConfig);
    podId = await podFactory.latestPodId();
    const safeAddress = await podFactory.getPodSafe(podId);
    timelockAddress = await podFactory.getPodTimelock(podId);

    const podMemberSigner = await getImpersonatedSigner(podConfig.members[0]);

    // 2.0 Instantiate Gnosis SDK
    podTimelock = new ethers.Contract(timelockAddress, timelockABI, podMemberSigner);
    const safeSDK = await initialiseGnosisSDK(podMemberSigner, safeAddress);

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
    // 1. Create proposal on the NopeDAO to veto. This proposal needs to
    //    call the podAdminGateway.veto() method with the proposalId that is in the timelock
    // 2. Have a member with >quorum TRIBE vote for proposal
    // 3. Validate that proposal is executed
    const userWithTribe = await getImpersonatedSigner(contractAddresses.multisig);
    const timelockProposalId = await podTimelock.hashOperation(
      contractAddresses.governanceMetadataRegistry,
      0,
      registryTxData,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    );

    // User proposes on NopeDAO
    const nopeDAO = contracts.nopeDAO;
    const description = 'Veto proposal';
    const calldatas = [
      contracts.podAdminGateway.interface.encodeFunctionData('veto', [podId, podTimelock.address, timelockProposalId])
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
    const readyTimestamp = await podTimelock.getTimestamp(timelockProposalId);
    expect(readyTimestamp).to.equal(0);
  });
});
