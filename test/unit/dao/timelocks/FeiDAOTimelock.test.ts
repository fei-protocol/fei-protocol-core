import { expectRevert, getAddresses, getCore, getImpersonatedSigner, latestTime } from '@test/helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Core, FeiDAOTimelock } from '@custom-types/contracts';
import { Signer } from '@ethersproject/abstract-signer';

describe('FeiDAOTimelock', function () {
  let userAddress: string;
  let guardianAddress: string;
  let governorAddress: string;
  let timelock: FeiDAOTimelock;
  let userSigner: Signer;
  let core: Core;
  let delay: number;

  beforeEach(async function () {
    ({ userAddress, guardianAddress, governorAddress } = await getAddresses());
    core = await getCore();

    delay = 1000;
    timelock = await (
      await ethers.getContractFactory('FeiDAOTimelock')
    ).deploy(core.address, userAddress, delay, delay);

    userSigner = await getImpersonatedSigner(userAddress);
  });

  describe('Pausable', function () {
    beforeEach(async function () {
      await timelock.connect(await getImpersonatedSigner(governorAddress)).pause();
    });

    it('queue reverts', async function () {
      const eta = (await latestTime()) + delay;
      await expectRevert(
        timelock.connect(userSigner).queueTransaction(userAddress, 100, '', '0x', eta),
        'Pausable: paused'
      );
    });

    it('execute reverts', async function () {
      const eta = (await latestTime()) + delay;
      await expectRevert(
        timelock.connect(userSigner).executeTransaction(userAddress, 100, '', '0x', eta),
        'Pausable: paused'
      );
    });
  });

  describe('Veto', function () {
    it('non-governor or guardian reverts', async function () {
      const eta = (await latestTime()) + delay;
      await expectRevert(
        timelock.connect(userSigner).vetoTransactions([userAddress], [100], [''], ['0x'], [eta]),
        'CoreRef: Caller is not a guardian or governor'
      );
    });

    it('guardian succeeds', async function () {
      const eta = (await latestTime()) + delay + delay;
      await timelock.connect(userSigner).queueTransaction(userAddress, 100, '', '0x', eta);

      const txHash = await timelock.getTxHash(userAddress, 100, '', '0x', eta);
      expect(await timelock.queuedTransactions(txHash)).to.be.equal(true);

      await timelock
        .connect(await getImpersonatedSigner(guardianAddress))
        .vetoTransactions([userAddress], [100], [''], ['0x'], [eta]);
      expect(await timelock.queuedTransactions(txHash)).to.be.equal(false);
    });

    it('governor succeeds', async function () {
      const eta = (await latestTime()) + delay + delay;
      await timelock.connect(userSigner).queueTransaction(userAddress, 100, '', '0x', eta);

      const txHash = await timelock.getTxHash(userAddress, 100, '', '0x', eta);
      expect(await timelock.queuedTransactions(txHash)).to.be.equal(true);

      await timelock
        .connect(await getImpersonatedSigner(governorAddress))
        .vetoTransactions([userAddress], [100], [''], ['0x'], [eta]);
      expect(await timelock.queuedTransactions(txHash)).to.be.equal(false);
    });
  });
});
