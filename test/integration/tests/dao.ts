import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, increaseTime, latestTime, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config.json';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-dao', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('FeiDAOTimelock', async function () {
    it('veto succeeds', async function () {
      const { feiDAO, feiDAOTimelock, timelock } = contracts;

      const eta = (await latestTime()) + 100000;
      const timelockSigner = await getImpersonatedSigner(feiDAO.address);
      await forceEth(feiDAO.address);
      const q = await feiDAOTimelock.connect(timelockSigner).queueTransaction(deployAddress, 100, '', '0x', eta);

      const txHash = (await q.wait()).events[0].args[0];
      expect(await feiDAOTimelock.queuedTransactions(txHash)).to.be.equal(true);

      await feiDAOTimelock
        .connect(await getImpersonatedSigner(deployAddress))
        .vetoTransactions([deployAddress], [100], [''], ['0x'], [eta]);
      expect(await feiDAOTimelock.queuedTransactions(txHash)).to.be.equal(false);
    });

    it('rollback succeeds', async function () {
      const { feiDAO, feiDAOTimelock, timelock, aaveEthPCVDeposit } = contracts;

      expect(await feiDAO.timelock()).to.be.equal(feiDAOTimelock.address);
      await feiDAOTimelock.connect(await getImpersonatedSigner(contractAddresses.multisig)).rollback();
      expect(await feiDAO.timelock()).to.be.equal(timelock.address);

      // Run some governance actions as timelock to make sure it still works
      const timelockSigner = await getImpersonatedSigner(timelock.address);
      await feiDAO.connect(timelockSigner).setProposalThreshold(11);
      expect((await feiDAO.proposalThreshold()).toString()).to.be.equal('11');

      await aaveEthPCVDeposit.connect(timelockSigner).pause();
      expect(await aaveEthPCVDeposit.paused()).to.be.true;
      await aaveEthPCVDeposit.connect(timelockSigner).unpause();
    });
  });

  describe('Fei DAO', function () {
    it.skip('rollback succeeds', async function () {
      const { feiDAO, timelock, governorAlphaBackup } = contracts;
      const { multisig } = contractAddresses;

      const signer = await ethers.getSigner(multisig);
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [multisig]
      });

      const deadline = await feiDAO.ROLLBACK_DEADLINE();
      await feiDAO.connect(signer).__rollback(deadline);

      await time.increaseTo(deadline.toString());

      await feiDAO.__executeRollback();

      expect(await timelock.pendingAdmin()).to.be.equal(governorAlphaBackup.address);

      await governorAlphaBackup.connect(signer).__acceptAdmin();

      expect(await timelock.admin()).to.be.equal(governorAlphaBackup.address);
    });

    it('proposal succeeds', async function () {
      const feiDAO = contracts.feiDAO;

      const targets = [feiDAO.address, contractAddresses.daiBondingCurve];
      const values = [0, 0];
      const calldatas = [
        '0x70b0f660000000000000000000000000000000000000000000000000000000000000000a', // set voting delay 10
        '0xe1d92bf8000000000000000000000000000000000000000000000000000000000000000b' // set bonding curve duration 11
      ];
      const description = [];

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [contractAddresses.multisig]
      });

      const signer = await ethers.getSigner(contractAddresses.multisig);

      // Propose
      // note ethers.js requires using this notation when two overloaded methods exist)
      // https://docs.ethers.io/v5/migration/web3/#migration-from-web3-js--contracts--overloaded-functions
      await feiDAO
        .connect(signer)
        ['propose(address[],uint256[],bytes[],string)'](targets, values, calldatas, description);

      const pid = await feiDAO.hashProposal(targets, values, calldatas, ethers.utils.keccak256(description));

      await time.advanceBlock();

      // vote
      await feiDAO.connect(signer).castVote(pid, 1);

      // advance to end of voting period
      const endBlock = (await feiDAO.proposals(pid)).endBlock;
      await time.advanceBlockTo(endBlock.toString());

      // queue
      await feiDAO['queue(address[],uint256[],bytes[],bytes32)'](
        targets,
        values,
        calldatas,
        ethers.utils.keccak256(description)
      );

      await time.increase('1000000');

      // execute
      await feiDAO['execute(address[],uint256[],bytes[],bytes32)'](
        targets,
        values,
        calldatas,
        ethers.utils.keccak256(description)
      );

      expect((await feiDAO.votingDelay()).toString()).to.be.equal('10');
      expect((await contracts.daiBondingCurve.duration()).toString()).to.be.equal('11');
    });
  });

  describe('Optimistic Approval', async () => {
    beforeEach(async function () {
      const { tribalChiefOptimisticMultisig, timelock } = contractAddresses;

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [tribalChiefOptimisticMultisig]
      });

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [timelock]
      });

      await (
        await ethers.getSigner(timelock)
      ).sendTransaction({ to: tribalChiefOptimisticMultisig, value: toBN('40000000000000000') });
    });

    it('governor can assume timelock admin', async () => {
      const { timelock } = contractAddresses;
      const { optimisticTimelock } = contracts;

      await optimisticTimelock.connect(await ethers.getSigner(timelock)).becomeAdmin();

      const admin = await optimisticTimelock.TIMELOCK_ADMIN_ROLE();
      expect(await optimisticTimelock.hasRole(admin, timelock)).to.be.true;
    });

    it('proposal can execute on tribalChief', async () => {
      const { tribalChiefOptimisticMultisig } = contractAddresses;
      const { optimisticTimelock, tribalChief } = contracts;

      const oldBlockReward = await tribalChief.tribePerBlock();
      await optimisticTimelock
        .connect(await ethers.getSigner(tribalChiefOptimisticMultisig))
        .schedule(
          tribalChief.address,
          0,
          '0xf580ffcb0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '500000'
        );

      const hash = await optimisticTimelock.hashOperation(
        tribalChief.address,
        0,
        '0xf580ffcb0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000001'
      );
      expect(await optimisticTimelock.isOperationPending(hash)).to.be.true;

      await increaseTime(500000);
      await optimisticTimelock
        .connect(await ethers.getSigner(tribalChiefOptimisticMultisig))
        .execute(
          tribalChief.address,
          0,
          '0xf580ffcb0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000001'
        );

      expect(await tribalChief.tribePerBlock()).to.be.bignumber.equal(toBN('1'));
      expect(await optimisticTimelock.isOperationDone(hash)).to.be.true;

      await tribalChief.updateBlockReward(oldBlockReward);
    });
  });

  describe('Access control', async () => {
    before(async () => {
      // Revoke deploy address permissions, so that does not erroneously
      // contribute to num governor roles etc
      await e2eCoord.revokeDeployAddressPermission();
    });

    it.skip('should have granted correct role cardinality', async function () {
      const core = contracts.core;
      const accessRights = e2eCoord.getAccessControlMapping();

      const minterId = await core.MINTER_ROLE();
      const numMinterRoles = await core.getRoleMemberCount(minterId);
      expect(numMinterRoles.toNumber()).to.be.equal(accessRights.minter.length);

      const burnerId = await core.BURNER_ROLE();
      const numBurnerRoles = await core.getRoleMemberCount(burnerId);
      expect(numBurnerRoles.toNumber()).to.be.equal(accessRights.burner.length);

      const pcvControllerId = await core.PCV_CONTROLLER_ROLE();
      const numPCVControllerRoles = await core.getRoleMemberCount(pcvControllerId);
      expect(numPCVControllerRoles.toNumber()).to.be.equal(accessRights.pcvController.length);

      const governorId = await core.GOVERN_ROLE();
      const numGovernorRoles = await core.getRoleMemberCount(governorId);
      expect(numGovernorRoles.toNumber()).to.be.equal(accessRights.governor.length);

      const guardianId = await core.GUARDIAN_ROLE();
      const numGuaridanRoles = await core.getRoleMemberCount(guardianId);
      expect(numGuaridanRoles.toNumber()).to.be.equal(accessRights.guardian.length);
    });

    it.skip('should have granted contracts correct roles', async function () {
      const core = contracts.core;
      const accessControl = e2eCoord.getAccessControlMapping();

      doLogging && console.log(`Testing minter role...`);
      for (let i = 0; i < accessControl.minter.length; i++) {
        const contractAddress = accessControl.minter[i];
        doLogging && console.log(`Minter contract address: ${contractAddress}`);
        const isMinter = await core.isMinter(contractAddress);
        expect(isMinter).to.be.true;
      }

      doLogging && console.log(`Testing burner role...`);
      for (let i = 0; i < accessControl.burner.length; i += 1) {
        const contractAddress = accessControl.burner[i];
        const isBurner = await core.isBurner(contractAddress);
        expect(isBurner).to.be.equal(true);
      }

      doLogging && console.log(`Testing pcv controller role...`);
      for (let i = 0; i < accessControl.pcvController.length; i += 1) {
        const contractAddress = accessControl.pcvController[i];
        const isPCVController = await core.isPCVController(contractAddress);
        expect(isPCVController).to.be.equal(true);
      }

      doLogging && console.log(`Testing guardian role...`);
      for (let i = 0; i < accessControl.guardian.length; i += 1) {
        const contractAddress = accessControl.guardian[i];
        const isGuardian = await core.isGuardian(contractAddress);
        expect(isGuardian).to.be.equal(true);
      }

      doLogging && console.log(`Testing governor role...`);
      for (let i = 0; i < accessControl.governor.length; i += 1) {
        const contractAddress = accessControl.governor[i];
        const isGovernor = await core.isGovernor(contractAddress);
        expect(isGovernor).to.be.equal(true);
      }

      /*
      doLogging && console.log(`Testing tribe minter address...`);
      const tribe = contracts.tribe;
      const tribeMinter = await tribe.minter();
      expect(tribeMinter).to.equal(contractAddresses.tribeReserveStabilizer);
      */ // re-enable after tribe reserve stabilizer is deployed
    });
  });
});
