import { expectRevert, time, getCore, getAddresses } from '../../helpers';
import { expect } from 'chai';
import hre, { artifacts, ethers, network } from 'hardhat';
import { Signer } from 'ethers';
import { TransactionResponse } from '@ethersproject/providers';

const FeiDAO = artifacts.readArtifactSync('FeiDAO');
const Timelock = artifacts.readArtifactSync('Timelock');
const Tribe = artifacts.readArtifactSync('Tribe');

const toBN = ethers.BigNumber.from;

describe('FeiDAO', function () {
  let userAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress } = await getAddresses());

    await network.provider.request({
      method: 'hardhat_reset',
      params: []
    });

    this.core = await getCore();
    const tribeAddress = await this.core.tribe();

    // Deploy timelock with vanilla user admin
    const timelockDeployer = await ethers.getContractFactory(Timelock.abi, Timelock.bytecode);
    this.timelock = await timelockDeployer.deploy(userAddress, 1, 1); // delay and min delay 1s

    // Deploy new Fei DAO
    const feiDAODeployer = await ethers.getContractFactory(FeiDAO.abi, FeiDAO.bytecode);
    this.feiDAO = await feiDAODeployer.deploy(tribeAddress, this.timelock.address);

    // Update timelock admin to Fei DAO
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [this.timelock.address]
    });
    await (
      await ethers.getSigner(userAddress)
    ).sendTransaction({ to: this.timelock.address, value: toBN('10000000000000000000') });
    await this.timelock.connect(await ethers.getSigner(this.timelock.address)).setPendingAdmin(this.feiDAO.address);
    await this.feiDAO.__acceptAdmin();

    // Send > quorum TRIBE to user
    await this.core.allocateTribe(userAddress, ethers.constants.WeiPerEther.mul(26_000_000).toString());

    // Self delegate user TRIBE
    const tribe = await ethers.getContractAt(Tribe.abi, tribeAddress);
    await tribe.connect(impersonatedSigners[userAddress]).delegate(userAddress);
  });

  describe('Init', function () {
    it('votingDelay', async function () {
      expect((await this.feiDAO.votingDelay()).toString()).to.be.equal('1');
    });

    it('votingPeriod', async function () {
      expect((await this.feiDAO.votingPeriod()).toString()).to.be.equal('13000');
    });

    it('quorum', async function () {
      expect((await this.feiDAO.quorum(1)).toString()).to.be.equal(
        ethers.constants.WeiPerEther.mul(25_000_000).toString()
      );
    });

    it('proposalThreshold', async function () {
      expect((await this.feiDAO.proposalThreshold()).toString()).to.be.equal(
        ethers.constants.WeiPerEther.mul(2_500_000).toString()
      );
    });

    it('token', async function () {
      expect(await this.feiDAO.token()).to.be.equal(await this.core.tribe());
    });

    it('timelock', async function () {
      expect(await this.feiDAO.timelock()).to.be.equal(this.timelock.address);
    });
  });

  describe('Set Parameters', function () {
    describe('Proposal', function () {
      // Testing a DAO proposal end-to-end which resets all governance params
      beforeEach(async function () {
        const targets = [this.feiDAO.address, this.feiDAO.address, this.feiDAO.address, this.feiDAO.address];
        const values = [0, 0, 0, 0];
        const calldatas = [
          '0x70b0f660000000000000000000000000000000000000000000000000000000000000000a', // set voting delay 10
          '0xea0217cf000000000000000000000000000000000000000000000000000000000000000b', // set voting period 11
          '0xc1ba4e59000000000000000000000000000000000000000000000000000000000000000c', // set quorum 12
          '0xece40cc1000000000000000000000000000000000000000000000000000000000000000d' // set proposal threshold 13
        ];
        const description = [];

        // Propose
        // note ethers.js requires using this notation when two overloaded methods exist)
        // https://docs.ethers.io/v5/migration/web3/#migration-from-web3-js--contracts--overloaded-functions
        await this.feiDAO
          .connect(impersonatedSigners[userAddress])
          ['propose(address[],uint256[],bytes[],string)'](targets, values, calldatas, description);

        const pid = await this.feiDAO.hashProposal(targets, values, calldatas, ethers.utils.keccak256(description));

        await time.advanceBlock();

        // vote
        await this.feiDAO.connect(impersonatedSigners[userAddress]).castVote(pid, 1);

        // advance to end of voting period
        const endBlock = (await this.feiDAO.proposals(pid)).endBlock;
        await time.advanceBlockTo(endBlock.toString());

        // queue
        await this.feiDAO['queue(address[],uint256[],bytes[],bytes32)'](
          targets,
          values,
          calldatas,
          ethers.utils.keccak256(description)
        );

        // execute
        const response: TransactionResponse = await this.feiDAO['execute(address[],uint256[],bytes[],bytes32)'](
          targets,
          values,
          calldatas,
          ethers.utils.keccak256(description)
        );

        expect(response).to.emit(this.feiDAO, 'VotingDelayUpdated').withArgs('1', '10');
        expect(response).to.emit(this.feiDAO, 'VotingPeriodUpdated').withArgs('13000', '11');
        expect(response)
          .to.emit(this.feiDAO, 'QuorumUpdated')
          .withArgs(ethers.constants.WeiPerEther.mul(25_000_000).toString(), '12');
        expect(response)
          .to.emit(this.feiDAO, 'ProposalThresholdUpdated')
          .withArgs(ethers.constants.WeiPerEther.mul(2_500_000).toString(), '13');
      });

      it('succeeds', async function () {
        expect((await this.feiDAO.votingDelay()).toString()).to.be.equal('10');
        expect((await this.feiDAO.votingPeriod()).toString()).to.be.equal('11');
        // quorum takes in an unused blockNo param set to 1 here
        expect((await this.feiDAO.quorum(1)).toString()).to.be.equal('12');
        expect((await this.feiDAO.proposalThreshold()).toString()).to.be.equal('13');
      });
    });

    // EOA calls to change governance params should revert
    describe('EOA', function () {
      it('voting delay reverts', async function () {
        await expectRevert(this.feiDAO.setVotingDelay(1), 'Governor: onlyGovernance');
      });

      it('voting period reverts', async function () {
        await expectRevert(this.feiDAO.setVotingPeriod(1), 'Governor: onlyGovernance');
      });

      it('quorum reverts', async function () {
        // quorum takes in an unused blockNo param set to 1 here
        await expectRevert(this.feiDAO.setQuorum(1), 'Governor: onlyGovernance');
      });

      it('proposal threshold reverts', async function () {
        await expectRevert(this.feiDAO.setProposalThreshold(1), 'Governor: onlyGovernance');
      });
    });
  });
});
