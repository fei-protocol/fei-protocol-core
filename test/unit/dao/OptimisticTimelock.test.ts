import { expectRevert, getAddresses, getCore, time } from '../../helpers';
import { expect } from 'chai'
import hre, { ethers, artifacts } from 'hardhat'
  
const OptimisticTimelock = artifacts.readArtifactSync('OptimisticTimelock');
const toBN = ethers.BigNumber.from
  
describe('TimelockedDelegator', function () {
  let userAddress: string
  let guardianAddress: string
  let governorAddress: string
  
  beforeEach(async function () {
    ({
      userAddress,
      guardianAddress,
      governorAddress,
    } = await getAddresses());
    this.core = await getCore();

    this.delay = new BN(1000);
    this.timelock = await OptimisticTimelock.new(this.core.address, userAddress, this.delay, this.delay);
  });

  describe('Pausable', function () {
    beforeEach(async function () {
      await this.timelock.pause({from: governorAddress});
    });

    it('queue reverts', async function() {
      const eta = (await time.latest()).add(this.delay);
      await expectRevert(this.timelock.queueTransaction(userAddress, 100, '', '0x0', eta, {from: userAddress}), 'Pausable: paused');
    });

    it('execute reverts', async function() {
      const eta = (await time.latest()).add(this.delay);
      await expectRevert(this.timelock.executeTransaction(userAddress, 100, '', '0x0', eta, {from: userAddress}), 'Pausable: paused');
    });
  });

  describe('Veto', function () {
    it('non-governor or guardian reverts', async function() {
      const eta = (await time.latest()).add(this.delay);
      await expectRevert(this.timelock.vetoTransactions([userAddress], [100], [''], ['0x0'], [eta], {from: userAddress}), 'CoreRef: Caller is not a guardian or governor');
    });

    it('guardian succeeds', async function() {
      const eta = (await time.latest()).add(this.delay).add(this.delay);
      await this.timelock.queueTransaction(userAddress, 100, '', '0x0', eta, {from: userAddress});

      const txHash = await this.timelock.getTxHash(userAddress, 100, '', '0x0', eta);
      expect(await this.timelock.queuedTransactions(txHash)).to.be.equal(true);

      await this.timelock.vetoTransactions([userAddress], [100], [''], ['0x0'], [eta], {from: guardianAddress});
      expect(await this.timelock.queuedTransactions(txHash)).to.be.equal(false);
    });

    it('governor succeeds', async function() {
      const eta = (await time.latest()).add(this.delay).add(this.delay);
      await this.timelock.queueTransaction(userAddress, 100, '', '0x0', eta, {from: userAddress});
  
      const txHash = await this.timelock.getTxHash(userAddress, 100, '', '0x0', eta);
      expect(await this.timelock.queuedTransactions(txHash)).to.be.equal(true);
  
      await this.timelock.vetoTransactions([userAddress], [100], [''], ['0x0'], [eta], {from: governorAddress});
      expect(await this.timelock.queuedTransactions(txHash)).to.be.equal(false);
    });
  });
});
