const {
  userAddress,
  secondUserAddress,
  beneficiaryAddress1,
  web3,
  BN,
  expectEvent,
  expectRevert,
  time,
  expect,
  MockTribe,
  TimelockedDelegator
} = require('../helpers');

describe('TimelockedDelegator', function () {

  beforeEach(async function () {
    this.tribe = await MockTribe.new({from: beneficiaryAddress1});
    this.window = new BN(4 * 365 * 24 * 60 * 60);
    this.delegator = await TimelockedDelegator.new(this.tribe.address, beneficiaryAddress1, this.window, {gas: 8000000, from: beneficiaryAddress1});
    this.totalTribe = new BN('10000');
    await this.tribe.mint(this.delegator.address, this.totalTribe);
  });

  describe('Init', function() {
    it('tribe', async function() {
      expect(await this.delegator.tribe()).to.be.equal(this.tribe.address);
    });

    it('totalDelegated', async function() {
      expect(await this.delegator.totalDelegated()).to.be.bignumber.equal(new BN('0'));
    });

    it('totalToken', async function() {
      expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.totalTribe);
    });
  });

  describe('Release', function() {
    describe('Immediate', function() {
      it('reverts', async function() {
        await expectRevert(this.delegator.release(beneficiaryAddress1, '100', {from: beneficiaryAddress1}), "LinearTokenTimelock: not enough released tokens");
      });
    });

    describe('Zero', function() {
      it('reverts', async function() {
        await expectRevert(this.delegator.release(beneficiaryAddress1, '0', {from: beneficiaryAddress1}), "LinearTokenTimelock: no amount desired");
      });
    });

    describe('One Quarter', function() {
      beforeEach(async function() {
        this.quarter = this.window.div(new BN(4));
        await time.increase(this.quarter);
        this.quarterAmount = this.totalTribe.div(new BN(4));
        expectEvent(
          await this.delegator.release(beneficiaryAddress1, this.quarterAmount, {from: beneficiaryAddress1}),
          'Release',
          {
            _beneficiary: beneficiaryAddress1,
            _recipient: beneficiaryAddress1,
            _amount: this.quarterAmount
          }
        );
      });
      it('releases tokens', async function() {
        expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.quarterAmount.mul(new BN(3)));
        expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(this.quarterAmount);
      });

      it('updates released amounts', async function() {
        expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.quarterAmount);
        expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(new BN(0));
      });

      describe('Another Quarter', function() {
        beforeEach(async function() {
          await time.increase(this.quarter);
          expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(this.quarterAmount);
          await this.delegator.release(beneficiaryAddress1, this.quarterAmount, {from: beneficiaryAddress1});
        });
        it('releases tokens', async function() {
          expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.totalTribe.div(new BN(2)));
          expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(this.totalTribe.div(new BN(2)));
        });

        it('updates released amounts', async function() {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.totalTribe.div(new BN(2)));
        });
      });

      describe('Excess Release', function() {
        it('reverts', async function() {
          await time.increase(this.quarter);
          await expectRevert(this.delegator.release(beneficiaryAddress1, this.totalTribe, {from: beneficiaryAddress1}), "LinearTokenTimelock: not enough released tokens");
        });
      });
    });

    describe('Total Window', function() {
      beforeEach(async function() {
        await time.increase(this.window);
      });

      describe('Total Release', function() {
        beforeEach(async function() {
          expectEvent(
            await this.delegator.release(beneficiaryAddress1, this.totalTribe, {from: beneficiaryAddress1}),
            'Release',
            {
              _beneficiary: beneficiaryAddress1,
              _recipient: beneficiaryAddress1,
              _amount: this.totalTribe
            }
          );
        });

        it('releases tokens', async function() {
          expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(0));
          expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(this.totalTribe);
        });
  
        it('updates released amounts', async function() {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.totalTribe);
          expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('Release To', function() {
        beforeEach(async function() {
          expectEvent(
            await this.delegator.release(userAddress, this.totalTribe, {from: beneficiaryAddress1}),
            'Release',
            {
              _beneficiary: beneficiaryAddress1,
              _recipient: userAddress,
              _amount: this.totalTribe
            }
          );
        });

        it('releases tokens', async function() {
          expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(0));
          expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.totalTribe);
          expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(new BN(0));

        });
  
        it('updates released amounts', async function() {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.totalTribe);
          expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('Partial Release', function() {
        beforeEach(async function() {
          this.halfAmount = this.totalTribe.div(new BN(2));
          expectEvent(
            await this.delegator.release(beneficiaryAddress1, this.halfAmount, {from: beneficiaryAddress1}),
            'Release',
            {
              _beneficiary: beneficiaryAddress1,
              _recipient: beneficiaryAddress1,
              _amount: this.halfAmount
            }
          );
        });

        it('releases tokens', async function() {
          expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.halfAmount);
          expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(this.halfAmount);

        });
  
        it('updates released amounts', async function() {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.halfAmount);
          expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(this.halfAmount);
        });
      });
    });
  });

  describe('Delegation', function() {
    describe('Not enough Tribe', function() {
      it('reverts', async function() {
        await expectRevert(this.delegator.delegate(userAddress, 10001, {from: beneficiaryAddress1}), "TimelockedDelegator: Not enough Tribe");
      });
    }); 
    describe('Enough Tribe', function() {
      beforeEach(async function() {
        expectEvent(
            await this.delegator.delegate(userAddress, 100, {from: beneficiaryAddress1}),
            'Delegate',
            {
              _delegatee: userAddress,
              _amount: "100"
            }
          );
      });
      describe('Single Delegation', function() {
        it('updates balances', async function() {
            expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(new BN(9900));
            let delegatee = await this.delegator.delegateContract(userAddress);
            expect(await this.tribe.balanceOf(delegatee)).to.be.bignumber.equal(new BN(100));
        });

        it('updates delegated amount', async function() {
            expect(await this.delegator.totalDelegated()).to.be.bignumber.equal(new BN(100));
        });

        it('maintains total token', async function() {
            expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(10000));
        });
      });

      describe('Double Delegation', function() {
        beforeEach(async function() {
          this.originalDelegatee = await this.delegator.delegateContract(userAddress);
          await this.delegator.delegate(userAddress, 100, {from: beneficiaryAddress1});
        });
        it('updates balances', async function() {
            expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(new BN(9800));
            let delegatee = await this.delegator.delegateContract(userAddress);
            expect(await this.tribe.balanceOf(delegatee)).to.be.bignumber.equal(new BN(200));
        });

        it('updates delegated amount', async function() {
            expect(await this.delegator.totalDelegated()).to.be.bignumber.equal(new BN(200));
        });

        it('maintains total token', async function() {
            expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(10000));
        });

        it('original delegatee is deleted', async function() {
          expect(await web3.eth.getCode(this.originalDelegatee)).to.be.equal('0x');
        });
      });

      describe('Undelegation', function() {
        beforeEach(async function() {
          this.delegatee = await this.delegator.delegateContract(userAddress);
          expectEvent(
              await this.delegator.undelegate(userAddress, {from: beneficiaryAddress1}),
              'Undelegate',
              {
                _delegatee: userAddress,
                _amount: "100"
              }
            );
        });
        it('updates balances', async function() {
            expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(new BN(10000));
            expect(await this.tribe.balanceOf(this.delegatee)).to.be.bignumber.equal(new BN(0));
        });

        it('updates delegated amount', async function() {
            expect(await this.delegator.totalDelegated()).to.be.bignumber.equal(new BN(0));
        });

        it('maintains total token', async function() {
            expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(10000));
        });

        it('delegatee is deleted', async function() {
          expect(await web3.eth.getCode(this.delegatee)).to.be.equal('0x');
        });

        describe('Double Undelegation', function() {
          it('reverts', async function() {
            await expectRevert(this.delegator.undelegate(userAddress, {from: beneficiaryAddress1}), "TimelockedDelegator: Delegate contract nonexistent");
          });
        });
      });
    }); 
  });

  describe('Token Drop', function() {
    beforeEach(async function() {
      await this.tribe.mint(this.delegator.address, 10000);
    });

    it('updates total token', async function() {
      expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(20000));
    });
  });

  describe('Access', function() {
    describe('Delegate', function() {
      it('Non-beneficiary set reverts', async function() {
        await expectRevert(this.delegator.delegate(userAddress, new BN(100), {from: userAddress}), "LinearTokenTimelock: Caller is not a beneficiary");
      });
    });
    describe('Undelegate', function() {
      it('Non-beneficiary set reverts', async function() {
        await expectRevert(this.delegator.undelegate(userAddress, {from: userAddress}), "LinearTokenTimelock: Caller is not a beneficiary");
      });
    });
    describe('Set Pending Beneficiary', function() {
      it('Beneficiary set succeeds', async function() {
        expectEvent(
          await this.delegator.setPendingBeneficiary(userAddress, {from: beneficiaryAddress1}),
          'PendingBeneficiaryUpdate',
          {_pendingBeneficiary: userAddress}
        );
        expect(await this.delegator.pendingBeneficiary()).to.be.equal(userAddress);
      });

      it('Non-beneficiary set reverts', async function() {
        await expectRevert(this.delegator.setPendingBeneficiary(userAddress, {from: userAddress}), "LinearTokenTimelock: Caller is not a beneficiary");
      });
    });

    describe('Accept Beneficiary', function() {
      it('Pending Beneficiary succeeds', async function() {
        await this.delegator.setPendingBeneficiary(userAddress, {from: beneficiaryAddress1});
        expectEvent(
          await this.delegator.acceptBeneficiary({from: userAddress}),
          'BeneficiaryUpdate',
          {_beneficiary: userAddress}
        );
        expect(await this.delegator.beneficiary()).to.be.equal(userAddress);
      });

      it('Non pending beneficiary reverts', async function() {
        await expectRevert(this.delegator.acceptBeneficiary({from: secondUserAddress}), "LinearTokenTimelock: Caller is not pending beneficiary");
      });
    });

    describe('Release', function() {
      it('Non-beneficiary set reverts', async function() {
        await expectRevert(this.delegator.release(userAddress, '100', {from: userAddress}), "LinearTokenTimelock: Caller is not a beneficiary");
      });
    });
  });
});