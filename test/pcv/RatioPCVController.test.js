const {
  BN,
  expectRevert,
  balance,
  expect,
  getAddresses,
  getCore,
  web3,
} = require('../helpers');

const RatioPCVController = artifacts.require('RatioPCVController');
const MockPCVDeposit = artifacts.require('MockEthUniswapPCVDeposit');

describe('RatioPCVController', function () {
  let userAddress;
  let governorAddress;
  let pcvControllerAddress;
  beforeEach(async function () {
    ({
      userAddress,
      governorAddress,
      pcvControllerAddress,
    } = await getAddresses());
    this.core = await getCore(true);

    this.pcvController = await RatioPCVController.new(this.core.address);

    this.pcvDeposit = await MockPCVDeposit.new(userAddress);
    await this.pcvDeposit.setBeneficiary(this.pcvDeposit.address);

    this.pcvAmount = new BN('10000000000');
    await web3.eth.sendTransaction({from: userAddress, to: this.pcvDeposit.address, value: this.pcvAmount});
  });
  
  describe('Withdraw', function() {
    describe('from pcvController', function() {
      it('100%', async function() {
          let userBalanceBefore = await balance.current(userAddress);
          await this.pcvController.withdrawRatio(this.pcvDeposit.address, userAddress, '10000', {from: pcvControllerAddress});
          let userBalanceAfter = await balance.current(userAddress);
          let reserveBalanceAfter = await balance.current(this.pcvDeposit.address);

          expect(reserveBalanceAfter).to.be.bignumber.equal(new BN('0'));
          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.bignumber.equal(this.pcvAmount);
      });

      it('50%', async function() {
          let userBalanceBefore = await balance.current(userAddress);
          let reserveBalanceBefore = await balance.current(this.pcvDeposit.address);
          await this.pcvController.withdrawRatio(this.pcvDeposit.address, userAddress, '5000', {from: pcvControllerAddress});
          let userBalanceAfter = await balance.current(userAddress);
          let reserveBalanceAfter = await balance.current(this.pcvDeposit.address);

          expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.bignumber.equal(this.pcvAmount.div(new BN('2')));
          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.bignumber.equal(this.pcvAmount.div(new BN('2')));
      });

      it('200% reverts', async function() {
          await expectRevert(this.pcvController.withdrawRatio(this.pcvDeposit.address, userAddress, '20000', {from: pcvControllerAddress}), "RatioPCVController: basisPoints too high");
      });

      it('0 value reverts', async function() {                
          await this.pcvController.withdrawRatio(this.pcvDeposit.address, userAddress, '10000', {from: pcvControllerAddress}); // withdraw all

          await expectRevert(this.pcvController.withdrawRatio(this.pcvDeposit.address, userAddress, '10000', {from: pcvControllerAddress}), "RatioPCVController: no value to withdraw");
      });
    });

    describe('not from pcvController', function() {
      it('reverts', async function() {
        await expectRevert(this.pcvController.withdrawRatio(this.pcvDeposit.address, userAddress, '10000', {from: userAddress}), "CoreRef: Caller is not a PCV controller");
      });
    });

    describe('paused', function() {
      it('reverts', async function() {
        await this.pcvController.pause({from: governorAddress});
        await expectRevert(this.pcvController.withdrawRatio(this.pcvDeposit.address, userAddress, '10000', {from: pcvControllerAddress}), "Pausable: paused");
      });
    });
  });
});