const {
    web3,
    BN,
    expectRevert,
    time,
    balance,
    expect,
    getAddresses,
    getCore,
  } = require('../helpers');
  
const PCVDripController = artifacts.require('PCVDripController');
const MockPCVDeposit = artifacts.require('MockEthUniswapPCVDeposit');
const Fei = artifacts.require('Fei');

describe('PCVDripController', function () {
  let userAddress;
  let governorAddress;
  let beneficiaryAddress1;
  
  beforeEach(async function () {
    ({
      beneficiaryAddress1,
      userAddress,
      governorAddress,
    } = await getAddresses());

    this.core = await getCore(true);
    this.fei = await Fei.at(await this.core.fei());
    
    this.sourcePCVDeposit = await MockPCVDeposit.new(beneficiaryAddress1);
    this.pcvDeposit = await MockPCVDeposit.new(beneficiaryAddress1);
    this.dripAmount = new BN('500000000000000000');
    this.incentiveAmount = new BN('100000000000000000');

    this.pcvDripper = await PCVDripController.new(this.core.address, this.sourcePCVDeposit.address, this.pcvDeposit.address, '1000', this.dripAmount, this.incentiveAmount);
    await this.core.grantMinter(this.pcvDripper.address, {from: governorAddress});

    await web3.eth.sendTransaction({from: userAddress, to: this.sourcePCVDeposit.address, value: "1000000000000000000"});
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
              let dripperBalanceBefore = await this.sourcePCVDeposit.balance();
              let beneficiaryBalanceBefore = await balance.current(this.pcvDeposit.address);
              await this.pcvDripper.drip();
              let dripperBalanceAfter = await this.sourcePCVDeposit.balance();
              let beneficiaryBalanceAfter = await balance.current(this.pcvDeposit.address);
  
              expect(dripperBalanceBefore.sub(dripperBalanceAfter)).to.be.bignumber.equal(this.dripAmount);
              expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore)).to.be.bignumber.equal(this.dripAmount);
  
              // timer reset
              expect(await this.pcvDripper.isTimeEnded()).to.be.equal(false);
          });
          describe('Target balance low enough', function() {
            it('succeeds', async function() {
                let sourceBalanceBefore = await this.sourcePCVDeposit.balance();
                let beneficiaryBalanceBefore = await balance.current(this.pcvDeposit.address);
                await this.pcvDripper.drip();
                let sourceBalanceAfter = await this.sourcePCVDeposit.balance();
                let beneficiaryBalanceAfter = await balance.current(this.pcvDeposit.address);
    
                expect(sourceBalanceBefore.sub(sourceBalanceAfter)).to.be.bignumber.equal(this.dripAmount);
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
                await expectRevert(this.pcvDripper.drip(), "PCVDripController: not eligible");
            });
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
                  let sourceBalanceBefore = await this.sourcePCVDeposit.balance();
                  let beneficiaryBalanceBefore = await balance.current(this.pcvDeposit.address);
                  await this.pcvDripper.drip();
                  let sourceBalanceAfter = await this.sourcePCVDeposit.balance();
                  let beneficiaryBalanceAfter = await balance.current(this.pcvDeposit.address);
      
                  expect(sourceBalanceBefore.sub(sourceBalanceAfter)).to.be.bignumber.equal(this.dripAmount);
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
                    await expectRevert(this.pcvDripper.drip(), "PCVDripController: not eligible");
                });
            });
        });
    });
    describe('Set dripAmount', function() {
      it('governor succeeds', async function() {
        await this.pcvDripper.setDripAmount('10000', {from: governorAddress});
        expect(await this.pcvDripper.dripAmount()).to.be.bignumber.equal(new BN('10000'));
      });

      it('non-governor reverts', async function() {
        await expectRevert(this.pcvDripper.setDripAmount('10000', {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Set Source', function() {
      it('governor succeeds', async function() {
        await this.pcvDripper.setSource(userAddress, {from: governorAddress});
        expect(await this.pcvDripper.source()).to.be.equal(userAddress);
      });

      it('non-governor reverts', async function() {
        await expectRevert(this.pcvDripper.setSource(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Set USD per FEI', function() {
      it('governor succeeds', async function() {
        await this.pcvDripper.setTarget(userAddress, {from: governorAddress});
        expect(await this.pcvDripper.target()).to.be.equal(userAddress);
      });

      it('non-governor reverts', async function() {
        await expectRevert(this.pcvDripper.setTarget(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});