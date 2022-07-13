import { ERC20, PodExecutor, TimelockController } from '@custom-types/contracts';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { getImpersonatedSigner, time } from '@test/helpers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { TestEndtoEndCoordinator } from '../setup';
import { forceEth } from '../setup/utils';

// Send DAI to a target address
const dummyProposal = (dai: ERC20, receiver: string, amount: number) => {
  return {
    target: dai.address,
    value: 0,
    payload: dai.interface.encodeFunctionData('transfer', [receiver, amount]),
    predecessor: '0x0000000000000000000000000000000000000000000000000000000000000000',
    salt: '0x0000000000000000000000000000000000000000000000000000000000000001'
  };
};

const dummyBatchProposal = (dai: ERC20, receiverA: string, receiverB: string, amount: number) => {
  return {
    targets: [dai.address, dai.address],
    values: [0, 0],
    payloads: [
      dai.interface.encodeFunctionData('transfer', [receiverA, amount]),
      dai.interface.encodeFunctionData('transfer', [receiverB, amount])
    ],
    predecessor: '0x0000000000000000000000000000000000000000000000000000000000000000',
    salt: '0x0000000000000000000000000000000000000000000000000000000000000001'
  };
};

describe('Pod executor', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let tcMultisigSigner: SignerWithAddress;
  let tribalCouncilTimelock: TimelockController;
  let podExecutor: PodExecutor;

  const daiAmount = 10;
  const receiverA = ethers.Wallet.createRandom().address;
  const receiverB = ethers.Wallet.createRandom().address;
  const receiverC = ethers.Wallet.createRandom().address;

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

    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    tcMultisigSigner = await getImpersonatedSigner(contractAddresses.tribalCouncilSafe);
    tribalCouncilTimelock = contracts.tribalCouncilTimelock as TimelockController;
    podExecutor = contracts.podExecutorV2 as PodExecutor;

    // Setup Tribal Council timelock with DAI
    const daiWhale = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const daiWhaleSigner = await getImpersonatedSigner(daiWhale); // Compound cDAI
    await forceEth(daiWhale);

    await contracts.dai
      .connect(daiWhaleSigner)
      .transfer(contractAddresses.tribalCouncilTimelock, ethers.constants.WeiPerEther.mul(1000));
  });

  ///////////////   DAO management of Tribal Council  //////////////
  it('should be able to execute scheduled transactions', async () => {
    const minDelay = await tribalCouncilTimelock.getMinDelay();
    const { target, value, payload, predecessor, salt } = dummyProposal(contracts.dai as ERC20, receiverA, daiAmount);

    // 1. Schedule a transaction
    await tribalCouncilTimelock.connect(tcMultisigSigner).schedule(target, value, payload, predecessor, salt, minDelay);

    const proposalId = await tribalCouncilTimelock.hashOperation(target, value, payload, predecessor, salt);

    // 2. Fast forward time until can be executed
    await time.increase(minDelay);

    // 3. execute via podExecutor
    await podExecutor.execute(tribalCouncilTimelock.address, target, value, payload, predecessor, salt);

    // Verify operation marked as complete and intended effect happened
    expect(await tribalCouncilTimelock.isOperationDone(proposalId)).to.be.true;
    expect(await contracts.dai.balanceOf(receiverA)).to.be.equal(daiAmount);
  });

  it('should be able to executeBatch batch scheduled transactions', async () => {
    const minDelay = await tribalCouncilTimelock.getMinDelay();

    const { targets, values, payloads, predecessor, salt } = dummyBatchProposal(
      contracts.dai as ERC20,
      receiverB,
      receiverC,
      daiAmount
    );

    // 1. Batch schedule a transaction
    await tribalCouncilTimelock
      .connect(tcMultisigSigner)
      .scheduleBatch(targets, values, payloads, predecessor, salt, minDelay);

    const proposalId = await tribalCouncilTimelock.hashOperationBatch(targets, values, payloads, predecessor, salt);

    // 2. Fast forward time until can be executed
    await time.increase(minDelay);

    // 3. executeBatch via podExecutor
    await podExecutor.executeBatch(tribalCouncilTimelock.address, targets, values, payloads, predecessor, salt);

    // Verify operation executed
    expect(await tribalCouncilTimelock.isOperationDone(proposalId)).to.be.true;
    expect(await contracts.dai.balanceOf(receiverB)).to.be.equal(daiAmount);
    expect(await contracts.dai.balanceOf(receiverC)).to.be.equal(daiAmount);
  });

  it('guardian should be able to pause PodExecutor', async () => {
    const guardianSigner = await getImpersonatedSigner(contractAddresses.guardianMultisig);
    await podExecutor.connect(guardianSigner).pause();
    expect(await podExecutor.paused()).to.be.true;
  });
});
