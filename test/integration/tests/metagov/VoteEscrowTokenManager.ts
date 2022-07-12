import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { getImpersonatedSigner, expectRevert, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { MockVoteEscrowTokenManager } from '@custom-types/contracts';

const e18 = (x: any) => ethers.constants.WeiPerEther.mul(x);

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
    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);
    ({ contracts } = await e2eCoord.loadEnvironment());
  });

  describe('utils/VoteEscrowTokenManager.sol', function () {
    let locker: MockVoteEscrowTokenManager;

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
      it('setLockDuration() should revert', async () => {
        await expectRevert(locker.setLockDuration(365 * 86400), 'UNAUTHORIZED');
      });

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

      it('setLockDuration() should change lock duration', async function () {
        expect(await locker.lockDuration()).to.be.equal(4 * 365 * 86400);
        await locker.setLockDuration(1 * 365 * 86400);
        expect(await locker.lockDuration()).to.be.equal(1 * 365 * 86400);
        await locker.setLockDuration(4 * 365 * 86400);
        expect(await locker.lockDuration()).to.be.equal(4 * 365 * 86400);
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
});
