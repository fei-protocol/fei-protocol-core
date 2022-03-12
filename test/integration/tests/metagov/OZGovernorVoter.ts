import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { getImpersonatedSigner, expectRevert, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { MockOZGovernorVoter } from '@custom-types/contracts';

const e18 = (x) => ethers.constants.WeiPerEther.mul(x);

describe('e2e-metagov', function () {
  let deployAddress: string;
  let contracts: NamedContracts;
  let e2eCoord: TestEndtoEndCoordinator;
  const logging = Boolean(process.env.LOGGING);

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
  });

  before(async function () {
    deployAddress = (await ethers.getSigners())[0].address;
    const config = {
      logging,
      deployAddress,
      version: 1
    };
    e2eCoord = new TestEndtoEndCoordinator(config, proposals);
    ({ contracts } = await e2eCoord.loadEnvironment());
  });

  describe('utils/OZGovernorVoter.sol', function () {
    let voter: MockOZGovernorVoter;

    before(async function () {
      // Create the contract
      const factory = await ethers.getContractFactory('MockOZGovernorVoter');
      voter = await factory.deploy(contracts.core.address);
      await voter.deployTransaction.wait();

      // Seed the contract with some tokens
      const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
      await forceEth(contracts.feiDAOTimelock.address);
      await contracts.core.connect(daoSigner).allocateTribe(voter.address, e18(25_000_000));

      // TRIBE does not delegate itself automatically, so we call delegate() on the token
      const voterSigner = await getImpersonatedSigner(voter.address);
      await forceEth(voter.address);
      await contracts.tribe.connect(voterSigner).delegate(voter.address);
    });

    describe('without METAGOVERNANCE_VOTE_ADMIN role', function () {
      it('propose() should revert', async function () {
        await expectRevert(
          voter.propose(
            contracts.feiDAO.address,
            [contracts.fei.address], // targets
            ['0'], // values
            [
              '0x095ea7b30000000000000000000000006ef71cA9cD708883E129559F5edBFb9d9D5C61480000000000000000000000000000000000000000000000000000000000003039'
            ], // calldata
            'description' // description
          ),
          'UNAUTHORIZED'
        );
      });

      it('castVote() should revert', async function () {
        await expectRevert(
          voter.castVote(
            contracts.feiDAO.address, // governor
            '12345', // proposalId
            '1' // support
          ),
          'UNAUTHORIZED'
        );
      });
    });

    describe('with METAGOVERNANCE_VOTE_ADMIN role', function () {
      before(async function () {
        // grant role
        await forceEth(contracts.feiDAOTimelock.address);
        const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
        await contracts.core.connect(daoSigner).grantRole(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), deployAddress);
      });

      after(async function () {
        // revoke role
        await forceEth(contracts.feiDAOTimelock.address);
        const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
        await contracts.core.connect(daoSigner).revokeRole(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), deployAddress);
      });

      it('should be able to create a proposal and vote for it', async function () {
        const governor = await ethers.getContractAt('IOZGovernor', contracts.feiDAO.address);

        // create proposal
        const proposeTx = await voter.propose(
          contracts.feiDAO.address,
          [contracts.fei.address], // targets
          ['0'], // values
          [
            '0x095ea7b30000000000000000000000006ef71cA9cD708883E129559F5edBFb9d9D5C61480000000000000000000000000000000000000000000000000000000000003039'
          ], // calldatas
          'description' // description
        );
        const proposeTxReceipt = await proposeTx.wait();
        const proposalId = proposeTxReceipt.logs[0].data.slice(0, 66); // '0xabcdef...'

        // check state of proposal
        expect(await governor.state(proposalId)).to.be.equal(0); // 0: pending
        await time.advanceBlock();
        expect(await governor.state(proposalId)).to.be.equal(1); // 1: active

        // vote for proposal
        expect((await contracts.feiDAO.proposals(proposalId)).forVotes).to.be.equal(0);
        await voter.castVote(contracts.feiDAO.address, proposalId, '1');
        expect((await contracts.feiDAO.proposals(proposalId)).forVotes).to.be.equal(e18(25_000_000));
      });
    });
  });
});
