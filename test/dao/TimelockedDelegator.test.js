const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockTribe = contract.fromArtifact('MockTribe');
const TimelockedDelegator = contract.fromArtifact('TimelockedDelegator');

describe('TimelockedDelegator', function () {
  const [ userAddress, beneficiaryAddress, badActorAddress ] = accounts;

  beforeEach(async function () {
    this.tribe = await MockTribe.new({from: beneficiaryAddress});
    this.window = new BN(4 * 365 * 24 * 60 * 60);
    this.delegator = await TimelockedDelegator.new(this.tribe.address, beneficiaryAddress, this.window, {gas: 8000000, from: beneficiaryAddress});
    await this.tribe.mint(this.delegator.address, 10000);
  });

  describe('Timelocks', function() {
    describe('Immediate', function() {
      it('reverts', async function() {
        await expectRevert(this.delegator.release({from: beneficiaryAddress}), "LinearTokenTimelock: no tokens to release");
      });
    });

    describe('One Quarter', function() {
      beforeEach(async function() {
        this.quarter = this.window.div(new BN(4));
        await time.increase(this.quarter);
        expectEvent(
          await this.delegator.release({from: beneficiaryAddress}),
          'Release',
          {
            _beneficiary: beneficiaryAddress,
            _amount: '2500'
          }
        );
      });
      it('releases tokens', async function() {
        expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(7500));
        expect(await this.tribe.balanceOf(beneficiaryAddress)).to.be.bignumber.equal(new BN(2500));
      });

      it('updates released amounts', async function() {
        expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(new BN(2500));
        expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(new BN(0));
      });

      describe('Another Quarter', function() {
        beforeEach(async function() {
          await time.increase(this.quarter);
          expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(new BN(2500));
          await this.delegator.release({from: beneficiaryAddress});
        });
        it('releases tokens', async function() {
          expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(5000));
          expect(await this.tribe.balanceOf(beneficiaryAddress)).to.be.bignumber.equal(new BN(5000));
        });

        it('updates released amounts', async function() {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(new BN(5000));
        });
      });
    });

    describe('Total Window', function() {
      beforeEach(async function() {
        await time.increase(this.window);
        await this.delegator.release({from: beneficiaryAddress});
      });
      it('releases tokens', async function() {
        expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(0));
        expect(await this.tribe.balanceOf(beneficiaryAddress)).to.be.bignumber.equal(new BN(10000));
      });

      it('updates released amounts', async function() {
        expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(new BN(10000));
        expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(new BN(0));
      });
    });
  });

  describe('Delegation', function() {
    describe('Not enough Tribe', function() {
      it('reverts', async function() {
        await expectRevert(this.delegator.delegate(userAddress, 10001, {from: beneficiaryAddress}), "TimelockedDelegator: Not enough Tribe");
      });
    }); 
    describe('Enough Tribe', function() {
      beforeEach(async function() {
        expectEvent(
            await this.delegator.delegate(userAddress, 100, {from: beneficiaryAddress}),
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
            let delegatee = await this.delegator.delegateContracts(userAddress);
            expect(await this.tribe.balanceOf(delegatee)).to.be.bignumber.equal(new BN(100));
        });

        it('updates delegated amount', async function() {
            expect(await this.delegator.delegatedAmount()).to.be.bignumber.equal(new BN(100));
        });

        it('maintains total token', async function() {
            expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(10000));
        });
      });

      describe('Double Delegation', function() {
        beforeEach(async function() {
          this.originalDelegatee = await this.delegator.delegateContracts(userAddress);
          await this.delegator.delegate(userAddress, 100, {from: beneficiaryAddress});
        });
        it('updates balances', async function() {
            expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(new BN(9800));
            let delegatee = await this.delegator.delegateContracts(userAddress);
            expect(await this.tribe.balanceOf(delegatee)).to.be.bignumber.equal(new BN(200));
        });

        it('updates delegated amount', async function() {
            expect(await this.delegator.delegatedAmount()).to.be.bignumber.equal(new BN(200));
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
          this.delegatee = await this.delegator.delegateContracts(userAddress);
          expectEvent(
              await this.delegator.undelegate(userAddress, {from: beneficiaryAddress}),
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
            expect(await this.delegator.delegatedAmount()).to.be.bignumber.equal(new BN(0));
        });

        it('maintains total token', async function() {
            expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(10000));
        });

        it('delegatee is deleted', async function() {
          expect(await web3.eth.getCode(this.delegatee)).to.be.equal('0x');
        });

        describe('Double Undelegation', function() {
          it('reverts', async function() {
            await expectRevert(this.delegator.undelegate(userAddress, {from: beneficiaryAddress}), "TimelockedDelegator: Delegate contract nonexistent");
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
          await this.delegator.setPendingBeneficiary(userAddress, {from: beneficiaryAddress}),
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
        await this.delegator.setPendingBeneficiary(userAddress, {from: beneficiaryAddress});
        expectEvent(
          await this.delegator.acceptBeneficiary({from: userAddress}),
          'BeneficiaryUpdate',
          {_beneficiary: userAddress}
        );
        expect(await this.delegator.beneficiary()).to.be.equal(userAddress);
      });

      it('Non pending beneficiary reverts', async function() {
        await expectRevert(this.delegator.acceptBeneficiary({from: badActorAddress}), "LinearTokenTimelock: Caller is not pending beneficiary");
      });
    });

    describe('Release', function() {
      it('Non-beneficiary set reverts', async function() {
        await expectRevert(this.delegator.release({from: userAddress}), "LinearTokenTimelock: Caller is not a beneficiary");
      });
    });
  });
});