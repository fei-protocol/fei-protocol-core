const {
    userAddress,
    governorAddress, 
    pcvControllerAddress,
    web3,
    BN,
    expectRevert,
    time,
    balance,
    expect,
    contract,
    getCore,
    beneficiaryAddress1
  } = require('../helpers');
  
const EthPCVDripper = contract.fromArtifact('EthPCVDripper');
const MockPCVDeposit = contract.fromArtifact('MockEthUniswapPCVDeposit');

  describe('EthPCVDripper', function () {
  
    beforeEach(async function () {
      this.core = await getCore(true);
      
      this.pcvDeposit = await MockPCVDeposit.new(beneficiaryAddress1);
      this.dripAmount = new BN('500000000000000000');

      this.pcvDripper = await EthPCVDripper.new(this.core.address, this.pcvDeposit.address, '1000', this.dripAmount);

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
          beforeEach(async function() {
            await time.increase('1000');
          });
          describe('Target balance low enough', function() {
            it('succeeds', async function() {
                let dripperBalanceBefore = await this.pcvDripper.balance();
                let beneficiaryBalanceBefore = await balance.current(this.pcvDeposit.address);
                await this.pcvDripper.drip();
                let dripperBalanceAfter = await this.pcvDripper.balance();
                let beneficiaryBalanceAfter = await balance.current(this.pcvDeposit.address);
    
                expect(dripperBalanceBefore.sub(dripperBalanceAfter)).to.be.bignumber.equal(this.dripAmount);
                expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore)).to.be.bignumber.equal(this.dripAmount);
    
                // timer reset
                expect(await this.pcvDripper.isTimeEnded()).to.be.equal(false);
            });
        });

        describe('Target balance too high', function() {
            beforeEach(async function() {
                await web3.eth.sendTransaction({from: userAddress, to: this.pcvDeposit.address, value: this.dripAmount});
            });

            it('reverts', async function() {        
                await expectRevert(this.pcvDripper.drip(), "EthPCVDripper: target balance too high");
            });
        });
      });

      describe('Second attempt', function() {
        beforeEach(async function() {
            await time.increase('1000');
            await this.pcvDripper.drip();
        });

        describe('Before time', function() {
            it('reverts', async function() {
                await expectRevert(this.pcvDripper.drip(), "Timed: time not ended");
            });
        });

        describe('After time', function() {
            describe('Target balance low enough', function() {
                beforeEach(async function() {
                    await this.pcvDeposit.withdraw(userAddress, this.dripAmount);
                    await time.increase('1000');
                });
                it('succeeds', async function() {
                    let dripperBalanceBefore = await this.pcvDripper.balance();
                    let beneficiaryBalanceBefore = await balance.current(this.pcvDeposit.address);
                    await this.pcvDripper.drip();
                    let dripperBalanceAfter = await this.pcvDripper.balance();
                    let beneficiaryBalanceAfter = await balance.current(this.pcvDeposit.address);
        
                    expect(dripperBalanceBefore.sub(dripperBalanceAfter)).to.be.bignumber.equal(this.dripAmount);
                    expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore)).to.be.bignumber.equal(this.dripAmount);
        
                    // timer reset
                    expect(await this.pcvDripper.isTimeEnded()).to.be.equal(false);
                });
            });
    
            describe('Target balance too high', function() {
                beforeEach(async function() {
                    await web3.eth.sendTransaction({from: userAddress, to: this.pcvDeposit.address, value: this.dripAmount});
                    await time.increase('1000');
                });

                it('reverts', async function() {        
                    await expectRevert(this.pcvDripper.drip(), "EthPCVDripper: target balance too high");
                });
            });
        });
    });
  
    describe('Withdraw', function() {
      it('enough eth succeeds', async function() {
        let dripperBalanceBefore = await this.pcvDripper.balance();
        let beneficiaryBalanceBefore = await balance.current(beneficiaryAddress1);

        await this.pcvDripper.withdraw(beneficiaryAddress1, '10000', {from: pcvControllerAddress});
        let dripperBalanceAfter = await this.pcvDripper.balance();
        let beneficiaryBalanceAfter = await balance.current(beneficiaryAddress1);

        expect(dripperBalanceBefore.sub(dripperBalanceAfter)).to.be.bignumber.equal(new BN('10000'));
        expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore)).to.be.bignumber.equal(new BN('10000'));
      });

      it('not enough eth reverts', async function() {
        await expectRevert(this.pcvDripper.withdraw(beneficiaryAddress1, '10000000000000000000', {from: pcvControllerAddress}), "revert");
      });

      it('non pcvController', async function() {
        await expectRevert(this.pcvDripper.withdraw(beneficiaryAddress1, '10000', {from: beneficiaryAddress1}), "CoreRef: Caller is not a PCV controller");
      });
    });
  });
});