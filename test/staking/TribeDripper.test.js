const {
    governorAddress, 
    pcvControllerAddress,
    BN,
    expectRevert,
    time,
    expect,
    Tribe,
    TribeDripper,
    getCore,
    beneficiaryAddress1
  } = require('../helpers');

  describe('TribeDripper', function () {

    beforeEach(async function () {
      this.core = await getCore(true);
      this.tribe = await Tribe.at(await this.core.tribe());

      this.totalDripAmount = new BN("100000000000000000000000000");
      this.dripAmounts = [
        "50000000000000000000000000", 
        "30000000000000000000000000", 
        "20000000000000000000000000"
      ];
      this.tribeDripper = await TribeDripper.new(this.core.address, beneficiaryAddress1, '1000', this.dripAmounts);

      await this.core.allocateTribe(this.tribeDripper.address, this.totalDripAmount, {from: governorAddress});
    });

    describe('Drip', function() {
        describe('Paused', function() {
            it('reverts', async function() {
                await this.tribeDripper.pause({from: governorAddress});
                await expectRevert(this.tribeDripper.drip(), "Pausable: paused");
            });
        });

        describe('Drip1', function() {
            it('succeeds', async function() {
                let dripperBalanceBefore = await this.tribe.balanceOf(this.tribeDripper.address);
                let beneficiaryBalanceBefore = await this.tribe.balanceOf(beneficiaryAddress1);
                await this.tribeDripper.drip();
                let dripperBalanceAfter = await this.tribe.balanceOf(this.tribeDripper.address);
                let beneficiaryBalanceAfter = await this.tribe.balanceOf(beneficiaryAddress1);

                expect(dripperBalanceBefore.sub(dripperBalanceAfter)).to.be.bignumber.equal(this.dripAmounts[0]);
                expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore)).to.be.bignumber.equal(this.dripAmounts[0]);

                // timer reset
                expect(await this.tribeDripper.isTimeEnded()).to.be.equal(false);
            });
        });

        describe('Drip2', function() {
            beforeEach(async function() {
                await this.tribeDripper.drip();
            });

            describe('Before time', function() {
                it('reverts', async function() {
                    await expectRevert(this.tribeDripper.drip(), "TribeDripper: time not ended");
                });
            });

            describe('After time', function() {
                beforeEach(async function() {
                    await time.increase('1000');
                });
                it('succeeds', async function() {
                    let dripperBalanceBefore = await this.tribe.balanceOf(this.tribeDripper.address);
                    let beneficiaryBalanceBefore = await this.tribe.balanceOf(beneficiaryAddress1);
                    await this.tribeDripper.drip();
                    let dripperBalanceAfter = await this.tribe.balanceOf(this.tribeDripper.address);
                    let beneficiaryBalanceAfter = await this.tribe.balanceOf(beneficiaryAddress1);

                    expect(dripperBalanceBefore.sub(dripperBalanceAfter)).to.be.bignumber.equal(this.dripAmounts[1]);
                    expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore)).to.be.bignumber.equal(this.dripAmounts[1]);

                    // timer reset
                    expect(await this.tribeDripper.isTimeEnded()).to.be.equal(false);
                });
            });
        });

        describe('Drip3', function() {
            beforeEach(async function() {
                await this.tribeDripper.drip();
                await time.increase('1000');
                await this.tribeDripper.drip();
            });

            describe('Before time', function() {
                it('reverts', async function() {
                    await expectRevert(this.tribeDripper.drip(), "TribeDripper: time not ended");
                });
            });

            describe('After time', function() {
                beforeEach(async function() {
                    await time.increase('1000');
                });
                it('succeeds', async function() {
                    let dripperBalanceBefore = await this.tribe.balanceOf(this.tribeDripper.address);
                    let beneficiaryBalanceBefore = await this.tribe.balanceOf(beneficiaryAddress1);
                    await this.tribeDripper.drip();
                    let dripperBalanceAfter = await this.tribe.balanceOf(this.tribeDripper.address);
                    let beneficiaryBalanceAfter = await this.tribe.balanceOf(beneficiaryAddress1);

                    expect(dripperBalanceBefore.sub(dripperBalanceAfter)).to.be.bignumber.equal(this.dripAmounts[2]);
                    expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore)).to.be.bignumber.equal(this.dripAmounts[2]);

                    // timer reset
                    expect(await this.tribeDripper.isTimeEnded()).to.be.equal(false);
                });
            });
        });

        describe('Drip4', function() {
            beforeEach(async function() {
                await this.tribeDripper.drip();
                await time.increase('1000');
                await this.tribeDripper.drip();
                await time.increase('1000');
                await this.tribeDripper.drip();
                await time.increase('1000');
            });

            it('reverts', async function() {
                await expectRevert(this.tribeDripper.drip(), "TribeDripper: index out of bounds");
            });

        });
    });

    describe('Withdraw', function() {
      it('enough eth succeeds', async function() {
        let dripperBalanceBefore = await this.tribe.balanceOf(this.tribeDripper.address);
        let beneficiaryBalanceBefore = await this.tribe.balanceOf(beneficiaryAddress1);

        await this.tribeDripper.withdraw(beneficiaryAddress1, '10000', {from: pcvControllerAddress});
        let dripperBalanceAfter = await this.tribe.balanceOf(this.tribeDripper.address);
        let beneficiaryBalanceAfter = await this.tribe.balanceOf(beneficiaryAddress1);

        expect(dripperBalanceBefore.sub(dripperBalanceAfter)).to.be.bignumber.equal(new BN('10000'));
        expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore)).to.be.bignumber.equal(new BN('10000'));
      });

      it('not enough eth reverts', async function() {
        await expectRevert(this.tribeDripper.withdraw(beneficiaryAddress1, this.totalDripAmount.mul(new BN('2')), {from: pcvControllerAddress}), "revert");
      });

      it('non pcvController', async function() {
        await expectRevert(this.tribeDripper.withdraw(beneficiaryAddress1, '10000', {from: beneficiaryAddress1}), "CoreRef: Caller is not a PCV controller");
      });
    });
}); 