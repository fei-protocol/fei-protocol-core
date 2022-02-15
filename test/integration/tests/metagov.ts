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
import { deploy } from '@scripts/deploy/compoundPCVDeposit';

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

  describe('utils/VoteEscrowTokenManager.sol', function () {
    let locker: any;

    before(async function () {
      // Create the contract
      const factory = await ethers.getContractFactory('MockVoteEscrowTokenManager');
      locker = await factory.deploy(
        contracts.core.address,
        contracts.angle.address,
        contracts.veAngle.address,
        4 * 365 * 86400 // 4 years
      );
      await locker.deployTransaction.wait();
      // Whitelist contract for veToken locking
      const ANGLE_MULTISIG_ADDRESS = '0xdC4e6DFe07EFCa50a197DF15D9200883eF4Eb1c8';
      await forceEth(ANGLE_MULTISIG_ADDRESS);
      const angleMultisigSigner = await getImpersonatedSigner(ANGLE_MULTISIG_ADDRESS);
      const abi = ['function approveWallet(address _wallet)'];
      const smartWalletCheckerInterface = new ethers.utils.Interface(abi);
      const encodeWhitelistingCall = smartWalletCheckerInterface.encodeFunctionData('approveWallet', [locker.address]);
      await (
        await angleMultisigSigner.sendTransaction({
          data: encodeWhitelistingCall,
          to: '0xAa241Ccd398feC742f463c534a610529dCC5888E' // SmartWalletChecker
        })
      ).wait();
      // Seed the contract with some tokens
      const holder = '0x4f91F01cE8ec07c9B1f6a82c18811848254917Ab';
      await forceEth(holder);
      const signer = await getImpersonatedSigner(holder);
      await contracts.angle.connect(signer).transfer(locker.address, e18(10_000_000));
    });

    describe('without METAGOVERNANCE_TOKEN_STAKING role', function () {
      it('lock() should revert', async () => {
        await expectRevert(locker.lock(), 'UNAUTHORIZED');
      });

      it('exitLock() should revert', async () => {
        await expectRevert(locker.exitLock(), 'UNAUTHORIZED');
      });
    });

    describe('with METAGOVERNANCE_TOKEN_STAKING role', function () {
      before(async function () {
        // grant role
        await forceEth(contracts.feiDAOTimelock.address);
        const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
        await contracts.core
          .connect(daoSigner)
          .grantRole(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), deployAddress);
      });

      after(async function () {
        // revoke role
        await forceEth(contracts.feiDAOTimelock.address);
        const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
        await contracts.core
          .connect(daoSigner)
          .revokeRole(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), deployAddress);
      });

      it('initial lock()', async function () {
        expect(await contracts.angle.balanceOf(locker.address)).to.be.equal(e18(10_000_000));
        expect(await contracts.veAngle.balanceOf(locker.address)).to.be.equal('0');
        await locker.lock();
        expect(await contracts.angle.balanceOf(locker.address)).to.be.equal('0');
        expect(await contracts.veAngle.balanceOf(locker.address)).to.be.at.least(e18(9_900_000));
      });
      it('2 years later, increase lock time', async function () {
        await time.increase(2 * 365 * 86400); // 2 years
        expect(await contracts.angle.balanceOf(locker.address)).to.be.equal('0');
        expect(await contracts.veAngle.balanceOf(locker.address)).to.be.at.least(e18(4_900_000));
        expect(await contracts.veAngle.balanceOf(locker.address)).to.be.at.most(e18(5_100_000));
        await locker.lock();
        expect(await contracts.angle.balanceOf(locker.address)).to.be.equal('0');
        expect(await contracts.veAngle.balanceOf(locker.address)).to.be.at.least(e18(9_900_000));
      });
      it('lock more tokens', async function () {
        const holder = '0x4f91F01cE8ec07c9B1f6a82c18811848254917Ab';
        await forceEth(holder);
        const signer = await getImpersonatedSigner(holder);
        await contracts.angle.connect(signer).transfer(locker.address, e18(1_000_000));
        await locker.lock();
        expect(await contracts.angle.balanceOf(locker.address)).to.be.equal('0');
        expect(await contracts.veAngle.balanceOf(locker.address)).to.be.at.least(e18(10_900_000));
      });
      it('fast-forward 4 years', async function () {
        // fast-forwarding 4 years directly causes a revert without reason,
        // so we fast-forward 1 year at a time, and perform a checkpoint()
        // regularly.
        await time.increase(1 * 365 * 86400); // 1 years
        await contracts.veAngle.checkpoint();
        await time.increase(1 * 365 * 86400); // 2 years
        await contracts.veAngle.checkpoint();
        await time.increase(1 * 365 * 86400); // 3 years
        await contracts.veAngle.checkpoint();
        await time.increase(1 * 365 * 86400); // 4 years
        await contracts.veAngle.checkpoint();
      });
      it('exitLock() at the end of lockup period', async function () {
        expect(await contracts.angle.balanceOf(locker.address)).to.be.equal('0');
        expect(await contracts.veAngle.balanceOf(locker.address)).to.be.equal('0');
        await locker.exitLock();
        expect(await contracts.angle.balanceOf(locker.address)).to.be.at.least(e18(10_900_000));
        expect(await contracts.veAngle.balanceOf(locker.address)).to.be.equal('0');
      });
    });
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

  describe('utils/LiquidityGaugeManager.sol', function () {
    let manager: any;

    before(async function () {
      // Create the contract
      const factory = await ethers.getContractFactory('AngleDelegatorPCVDeposit');
      manager = await factory.deploy(contracts.core.address, deployAddress);
      await manager.deployTransaction.wait();

      // Whitelist contract for veToken locking
      const ANGLE_MULTISIG_ADDRESS = '0xdC4e6DFe07EFCa50a197DF15D9200883eF4Eb1c8';
      await forceEth(ANGLE_MULTISIG_ADDRESS);
      const angleMultisigSigner = await getImpersonatedSigner(ANGLE_MULTISIG_ADDRESS);
      const abi = ['function approveWallet(address _wallet)'];
      const smartWalletCheckerInterface = new ethers.utils.Interface(abi);
      const encodeWhitelistingCall = smartWalletCheckerInterface.encodeFunctionData('approveWallet', [manager.address]);
      await (
        await angleMultisigSigner.sendTransaction({
          data: encodeWhitelistingCall,
          to: '0xAa241Ccd398feC742f463c534a610529dCC5888E' // SmartWalletChecker
        })
      ).wait();
      // Seed the contract with some tokens
      const holder = '0x4f91F01cE8ec07c9B1f6a82c18811848254917Ab';
      await forceEth(holder);
      const signer = await getImpersonatedSigner(holder);
      await contracts.angle.connect(signer).transfer(manager.address, e18(10_000_000));

      // lock tokens to get voting power
      await forceEth(contracts.feiDAOTimelock.address);
      const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
      await contracts.core.connect(daoSigner).grantRole(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), deployAddress);
      await manager.lock();
      await contracts.core
        .connect(daoSigner)
        .revokeRole(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), deployAddress);
    });

    describe('without METAGOVERNANCE_GAUGE_ADMIN role', function () {
      it('setGaugeController() should revert', async function () {
        await expectRevert(
          manager.setGaugeController(
            contracts.angleGaugeController.address // gauge controller
          ),
          'UNAUTHORIZED'
        );
      });

      it('setTokenToGauge() should revert', async function () {
        await expectRevert(
          manager.setTokenToGauge(
            contracts.angleAgEurFeiPool.address, // token
            contracts.angleGaugeUniswapV2FeiAgEur.address // gauge
          ),
          'UNAUTHORIZED'
        );
      });
    });

    describe('without METAGOVERNANCE_VOTE_ADMIN role', function () {
      it('voteForGaugeWeight() should revert', async function () {
        await expectRevert(
          manager.voteForGaugeWeight(
            contracts.angleAgEurFeiPool.address, // token
            '10000' // 100%
          ),
          'UNAUTHORIZED'
        );
      });
    });

    describe('without METAGOVERNANCE_GAUGE_STAKING role', function () {
      it('stakeInGauge() should revert', async function () {
        await expectRevert(
          manager.stakeInGauge(
            contracts.angleAgEurFeiPool.address, // token
            '123' // amount
          ),
          'UNAUTHORIZED'
        );
      });

      it('stakeAllInGauge() should revert', async function () {
        await expectRevert(
          manager.stakeAllInGauge(
            contracts.angleAgEurFeiPool.address // token
          ),
          'UNAUTHORIZED'
        );
      });

      it('unstakeFromGauge() should revert', async function () {
        await expectRevert(
          manager.unstakeFromGauge(
            contracts.angleAgEurFeiPool.address, // token
            '123' // amount
          ),
          'UNAUTHORIZED'
        );
      });
    });

    describe('with roles', function () {
      before(async function () {
        // grant roles
        await forceEth(contracts.feiDAOTimelock.address);
        const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
        await contracts.core.connect(daoSigner).grantRole(ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'), deployAddress);
        await contracts.core.connect(daoSigner).grantRole(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), deployAddress);
        await contracts.core
          .connect(daoSigner)
          .grantRole(ethers.utils.id('METAGOVERNANCE_GAUGE_STAKING'), deployAddress);
      });

      after(async function () {
        // revoke roles
        await forceEth(contracts.feiDAOTimelock.address);
        const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
        await contracts.core
          .connect(daoSigner)
          .revokeRole(ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'), deployAddress);
        await contracts.core.connect(daoSigner).revokeRole(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), deployAddress);
        await contracts.core
          .connect(daoSigner)
          .revokeRole(ethers.utils.id('METAGOVERNANCE_GAUGE_STAKING'), deployAddress);
      });

      it('setGaugeController()', async function () {
        expect(await manager.gaugeController()).to.be.equal(contracts.angleGaugeController.address);
        await manager.setGaugeController(deployAddress);
        expect(await manager.gaugeController()).to.be.equal(deployAddress);
        await manager.setGaugeController(contracts.angleGaugeController.address);
        expect(await manager.gaugeController()).to.be.equal(contracts.angleGaugeController.address);
      });

      it('setTokenToGauge()', async function () {
        expect(await manager.tokenToGauge(contracts.angleAgEurFeiPool.address)).to.be.equal(
          ethers.constants.AddressZero
        );
        await manager.setTokenToGauge(
          contracts.angleAgEurFeiPool.address,
          contracts.angleGaugeUniswapV2FeiAgEur.address
        );
        expect(await manager.tokenToGauge(contracts.angleAgEurFeiPool.address)).to.be.equal(
          contracts.angleGaugeUniswapV2FeiAgEur.address
        );
      });

      it('voteForGaugeWeight()', async function () {
        expect(
          await contracts.angleGaugeController.last_user_vote(
            manager.address,
            contracts.angleGaugeUniswapV2FeiAgEur.address
          )
        ).to.be.equal('0'); // timestamp of last vote = 0, never voted

        // set token/gauge map
        await manager.setTokenToGauge(
          contracts.angleAgEurFeiPool.address,
          contracts.angleGaugeUniswapV2FeiAgEur.address
        );

        // vote
        await manager.voteForGaugeWeight(contracts.angleAgEurFeiPool.address, '10000');

        expect(
          await contracts.angleGaugeController.last_user_vote(
            manager.address,
            contracts.angleGaugeUniswapV2FeiAgEur.address
          )
        ).to.be.at.least('1'); // timestamp of last vote
      });

      it('stakeInGauge()', async function () {
        // seed the manager with some tokens
        const HOLDER = '0xd6282C5aEAaD4d776B932451C44b8EB453E44244';
        expect(await contracts.angleAgEurFeiPool.balanceOf(HOLDER)).to.be.at.least(e18(2000));
        const signer = await getImpersonatedSigner(HOLDER);
        await forceEth(HOLDER);
        await contracts.angleAgEurFeiPool.connect(signer).transfer(manager.address, e18(2000));

        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal('0');

        // stake 500 tokens in gauge
        await manager.stakeInGauge(
          contracts.angleAgEurFeiPool.address, // token
          e18(500) // amount
        );

        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal(e18(500));
      });

      it('stakeAllInGauge()', async function () {
        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal(e18(500));

        // stake remaining 1500 tokens in gauge
        await manager.stakeAllInGauge(
          contracts.angleAgEurFeiPool.address // token
        );

        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal(e18(2000));
      });

      it('unstakeFromGauge()', async function () {
        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal(e18(2000));
        expect(await contracts.angleAgEurFeiPool.balanceOf(manager.address)).to.be.equal('0');

        // unstake 2000 tokens from gauge
        await manager.unstakeFromGauge(
          contracts.angleAgEurFeiPool.address, // token
          e18(2000) // amount
        );

        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal('0');
        expect(await contracts.angleAgEurFeiPool.balanceOf(manager.address)).to.be.equal(e18(2000));
      });
    });
  });
});
