import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, increaseTime, latestTime, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
import { Core } from '@custom-types/contracts';
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
      const { feiDAO, feiDAOTimelock } = contracts;

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
  });

  describe('Fei DAO', function () {
    it('proposal succeeds', async function () {
      const feiDAO = contracts.feiDAO;

      const targets = [feiDAO.address];
      const values = [0];
      const calldatas = [
        '0x70b0f660000000000000000000000000000000000000000000000000000000000000000a' // set voting delay 10
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

      const signer = (await ethers.getSigners())[0];
      await signer.sendTransaction({
        to: timelock,
        value: ethers.utils.parseEther(`1`)
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

    it('should have granted correct role cardinality', async function () {
      const core = contracts.core;
      const accessRights = e2eCoord.getAccessControlMapping();

      const roles = Object.keys(accessRights);

      for (let i = 0; i < roles.length; i++) {
        const element = roles[i];
        const id = ethers.utils.id(element);
        const numRoles = await core.getRoleMemberCount(id);
        doLogging && console.log(`Role count for ${element}: ${numRoles}`);
        expect(numRoles.toNumber()).to.be.equal(accessRights[element].length);
      }
    });

    it('should have granted contracts correct roles', async function () {
      const core: Core = contracts.core as Core;
      const accessControl = e2eCoord.getAccessControlMapping();

      const roles = Object.keys(accessControl);

      for (let i = 0; i < roles.length; i++) {
        const element = roles[i];
        const id = ethers.utils.id(element);
        for (let i = 0; i < accessControl[element].length; i++) {
          const contractAddress = accessControl[element][i];
          doLogging && console.log(`${element} contract address: ${contractAddress}`);
          const isMinter = await core.hasRole(id, contractAddress);
          expect(isMinter).to.be.true;
        }
      }

      doLogging && console.log(`Testing tribe minter address...`);
      const tribe = contracts.tribe;
      const tribeMinter = await tribe.minter();
      expect(tribeMinter).to.equal(contractAddresses.tribeMinter);
    });
  });
});
