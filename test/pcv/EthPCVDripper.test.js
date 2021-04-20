const {
    userAddress,
    beneficiaryAddress1,
    governorAddress, 
    pcvControllerAddress,
    web3,
    BN,
    expectRevert,
    time,
    balance,
    expect,
    EthPCVDripper,
    getCore
  } = require('../helpers');
  
  describe('EthPCVDripper', function () {
  
    beforeEach(async function () {
      this.core = await getCore(true);
      
      this.dripAmount = new BN('500000000000000000');
      this.pcvDripper = await EthPCVDripper.new(this.core.address, beneficiaryAddress1, '1000', this.dripAmount);

      await web3.eth.sendTransaction({from: userAddress, to: this.pcvDripper.address, value: "1000000000000000000"});
    });
  
    describe('Drip', function() {
      describe('Paused', function() {
        it('reverts', async function() {
            await time.increase('1000');
            await this.pcvDripper.pause({from: governorAddress});
            await expectRevert(this.pcvDripper.drip(), "Pausable: paused");
        });
      });

      describe('Before time', function() {
        it('reverts', async function() {
            await expectRevert(this.pcvDripper.drip(), "Timed: time not ended");
        });
      });
  
      describe('After time', function() {

          it('succeeds', async function() {
            await time.increase('1000');

            let dripperBalanceBefore = await balance.current(this.pcvDripper.address);
            let beneficiaryBalanceBefore = await balance.current(beneficiaryAddress1);
            await this.pcvDripper.drip();
            let dripperBalanceAfter = await balance.current(this.pcvDripper.address);
            let beneficiaryBalanceAfter = await balance.current(beneficiaryAddress1);

            expect(dripperBalanceBefore.sub(dripperBalanceAfter)).to.be.bignumber.equal(this.dripAmount);
            expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore)).to.be.bignumber.equal(this.dripAmount);

            // timer reset
            expect(await this.pcvDripper.isTimeEnded()).to.be.equal(false);
          });
      });
    });
  
    describe('Withdraw', function() {
      it('enough eth succeeds', async function() {
        let dripperBalanceBefore = await balance.current(this.pcvDripper.address);
        let beneficiaryBalanceBefore = await balance.current(beneficiaryAddress1);

        await this.pcvDripper.withdrawETH(beneficiaryAddress1, '10000', {from: pcvControllerAddress});
        let dripperBalanceAfter = await balance.current(this.pcvDripper.address);
        let beneficiaryBalanceAfter = await balance.current(beneficiaryAddress1);

        expect(dripperBalanceBefore.sub(dripperBalanceAfter)).to.be.bignumber.equal(new BN('10000'));
        expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore)).to.be.bignumber.equal(new BN('10000'));
      });

      it('not enough eth reverts', async function() {
        await expectRevert(this.pcvDripper.withdrawETH(beneficiaryAddress1, '10000000000000000000', {from: pcvControllerAddress}), "revert");
      });

      it('non pcvController', async function() {
        await expectRevert(this.pcvDripper.withdrawETH(beneficiaryAddress1, '10000', {from: beneficiaryAddress1}), "CoreRef: Caller is not a PCV controller");
      });
    });
  });