import { Core, FeiDAO, Timelock } from '@custom-types/contracts';
import { TransactionResponse } from '@ethersproject/providers';
import { expectRevert, getAddresses, getCore, time } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import hre, { artifacts, ethers, network } from 'hardhat';

const Tribe = artifacts.readArtifactSync('Tribe');

const toBN = ethers.BigNumber.from;

describe('FeiDAO', function () {
  let userAddress: string;
  let governorAddress: string;
  let feiDAO: FeiDAO;
  let core: Core;
  let timelock: Timelock;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.governorAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, governorAddress } = await getAddresses());

    await network.provider.request({
      method: 'hardhat_reset',
      params: []
    });

    core = await getCore();
    const tribeAddress = await core.tribe();

    // Deploy timelock with vanilla user admin
    const timelockDeployer = await ethers.getContractFactory('Timelock');
    timelock = await timelockDeployer.deploy(userAddress, 1, 1); // delay and min delay 1s

    // Deploy new Fei DAO
    const feiDAODeployer = await ethers.getContractFactory('FeiDAO');
    feiDAO = await feiDAODeployer.deploy(tribeAddress, timelock.address, userAddress);

    // Update timelock admin to Fei DAO
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [timelock.address]
    });
    await (
      await ethers.getSigner(userAddress)
    ).sendTransaction({ to: timelock.address, value: toBN('10000000000000000000') });
    await timelock.connect(await ethers.getSigner(timelock.address)).setPendingAdmin(feiDAO.address);
    await feiDAO.__acceptAdmin();

    // Send > quorum TRIBE to user
    await core.allocateTribe(userAddress, ethers.constants.WeiPerEther.mul(26_000_000).toString());

    // Self delegate user TRIBE
    const tribe = await ethers.getContractAt(Tribe.abi, tribeAddress);
    await tribe.connect(impersonatedSigners[userAddress]).delegate(userAddress);
  });

  describe('Init', function () {
    it('votingDelay', async function () {
      expect((await feiDAO.votingDelay()).toString()).to.be.equal('1');
    });

    it('votingPeriod', async function () {
      expect((await feiDAO.votingPeriod()).toString()).to.be.equal('13000');
    });

    it('quorum', async function () {
      expect((await feiDAO.quorum(1)).toString()).to.be.equal(ethers.constants.WeiPerEther.mul(25_000_000).toString());
    });

    it('proposalThreshold', async function () {
      expect((await feiDAO.proposalThreshold()).toString()).to.be.equal(
        ethers.constants.WeiPerEther.mul(2_500_000).toString()
      );
    });

    it('token', async function () {
      expect(await feiDAO.token()).to.be.equal(await core.tribe());
    });

    it('timelock', async function () {
      expect(await feiDAO.timelock()).to.be.equal(timelock.address);
    });

    it('rollback deadline', async function () {
      expect((await feiDAO.ROLLBACK_DEADLINE()).toString()).to.be.equal('1635724800');
    });

    it('backup governor correct address', async function () {
      expect(await feiDAO.BACKUP_GOVERNOR()).to.be.equal('0x4C895973334Af8E06fd6dA4f723Ac24A5f259e6B');
    });
  });

  describe('Set Parameters', function () {
    describe('Proposal', function () {
      // Testing a DAO proposal end-to-end which resets all governance params
      beforeEach(async function () {
        const targets = [feiDAO.address, feiDAO.address, feiDAO.address, feiDAO.address];
        const values = [0, 0, 0, 0];
        const calldatas = [
          '0x70b0f660000000000000000000000000000000000000000000000000000000000000000a', // set voting delay 10
          '0xea0217cf000000000000000000000000000000000000000000000000000000000000000b', // set voting period 11
          '0xc1ba4e59000000000000000000000000000000000000000000000000000000000000000c', // set quorum 12
          '0xece40cc1000000000000000000000000000000000000000000000000000000000000000d' // set proposal threshold 13
        ];
        const description = '';

        // Propose
        // note ethers.js requires using this notation when two overloaded methods exist)
        // https://docs.ethers.io/v5/migration/web3/#migration-from-web3-js--contracts--overloaded-functions
        await feiDAO
          .connect(impersonatedSigners[userAddress])
          ['propose(address[],uint256[],bytes[],string)'](targets, values, calldatas, description);

        const pid = await feiDAO.hashProposal(targets, values, calldatas, ethers.utils.keccak256([]));

        await time.advanceBlock();

        // vote
        await feiDAO.connect(impersonatedSigners[userAddress]).castVote(pid, 1);

        // advance to end of voting period
        const endBlock = (await feiDAO.proposals(pid)).endBlock;
        await time.advanceBlockTo(endBlock.toNumber());

        // queue
        await feiDAO['queue(uint256)'](pid);

        // execute
        const response: TransactionResponse = await feiDAO['execute(uint256)'](pid);

        expect(response).to.emit(feiDAO, 'VotingDelayUpdated').withArgs('1', '10');
        expect(response).to.emit(feiDAO, 'VotingPeriodUpdated').withArgs('13000', '11');
        expect(response)
          .to.emit(feiDAO, 'QuorumUpdated')
          .withArgs(ethers.constants.WeiPerEther.mul(25_000_000).toString(), '12');
        expect(response)
          .to.emit(feiDAO, 'ProposalThresholdUpdated')
          .withArgs(ethers.constants.WeiPerEther.mul(2_500_000).toString(), '13');
      });

      it('succeeds', async function () {
        expect((await feiDAO.votingDelay()).toString()).to.be.equal('10');
        expect((await feiDAO.votingPeriod()).toString()).to.be.equal('11');
        // quorum takes in an unused blockNo param set to 1 here
        expect((await feiDAO.quorum(1)).toString()).to.be.equal('12');
        expect((await feiDAO.proposalThreshold()).toString()).to.be.equal('13');
      });
    });

    // EOA calls to change governance params should revert
    describe('EOA', function () {
      it('voting delay reverts', async function () {
        await expectRevert(feiDAO.setVotingDelay(1), 'Governor: onlyGovernance');
      });

      it('voting period reverts', async function () {
        await expectRevert(feiDAO.setVotingPeriod(1), 'Governor: onlyGovernance');
      });

      it('quorum reverts', async function () {
        // quorum takes in an unused blockNo param set to 1 here
        await expectRevert(feiDAO.setQuorum(1), 'Governor: onlyGovernance');
      });

      it('proposal threshold reverts', async function () {
        await expectRevert(feiDAO.setProposalThreshold(1), 'Governor: onlyGovernance');
      });
    });
  });
});
