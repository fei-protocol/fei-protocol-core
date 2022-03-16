import { PodFactory, PodAdminGateway } from '@custom-types/contracts';
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

describe('Tribal Council', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: SignerWithAddress;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let podFactory: PodFactory;
  let podAdminGateway: PodAdminGateway;
  let tribalCouncilPodId: BigNumber;
  let feiDAOTimelockSigner: SignerWithAddress;

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
    tribalCouncilPodId = await podFactory.getPodId(contractAddresses.tribalCouncilTimelock);

    feiDAOTimelockSigner = await getImpersonatedSigner(contractAddresses.feiDAOTimelock);
  });

  it('should allow DAO to add members', async () => {
    const initialNumPodMembers = await podFactory.getNumMembers(tribalCouncilPodId);

    const newMember = '0x0000000000000000000000000000000000000030';
    await podAdminGateway.connect(feiDAOTimelockSigner).addMemberToPod(tribalCouncilPodId, newMember);

    const numPodMembers = await podFactory.getNumMembers(tribalCouncilPodId);
    await expect(numPodMembers).to.equal(initialNumPodMembers.add(toBN(1)));

    const podMembers = await podFactory.getPodMembers(tribalCouncilPodId);
    expect(podMembers[0]).to.equal(newMember);
  });

  it('should allow DAO to remove members', async () => {
    const initialNumPodMembers = await podFactory.getNumMembers(tribalCouncilPodId);

    const memberToBurn = tribalCouncilMembers[0];
    await podAdminGateway.connect(feiDAOTimelockSigner).removeMemberFromPod(tribalCouncilPodId, memberToBurn);

    const numPodMembers = await podFactory.getNumMembers(tribalCouncilPodId);
    await expect(numPodMembers).to.equal(initialNumPodMembers.sub(toBN(1)));

    const podMembers = await podFactory.getPodMembers(tribalCouncilPodId);
    expect(!podMembers.includes(memberToBurn)).to.be.true;
  });

  it('can authorise another address with a role', async () => {
    // TODO: Follow up PR
  });

  it('can veto a lower ranking pod', async () => {
    // TODO: Follow up PR
  });

  it('should allow a proposal to be proposed and executed', async () => {
    // TODO: Test on testnet/mainnet
  });
});
