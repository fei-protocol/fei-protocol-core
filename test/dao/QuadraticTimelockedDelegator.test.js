const hre = require('hardhat');
const {
  web3,
  BN,
  expectEvent,
  expectRevert,
  getAddresses,
  time,
  expect,
} = require('../helpers');

const QuadraticTimelockedDelegator = artifacts.require('QuadraticTimelockedDelegator');
const MockTribe = artifacts.require('MockTribe');

describe('QuadraticTimelockedDelegator', function () {
  let userAddress;
  let secondUserAddress;
  let beneficiaryAddress1;

  beforeEach(async function () {
    ({
      userAddress,
      secondUserAddress,
      beneficiaryAddress1,
    } = await getAddresses());
    this.tribe = await MockTribe.new({from: beneficiaryAddress1});
    this.window = new BN(4 * 365 * 24 * 60 * 60);
    this.delegator = await QuadraticTimelockedDelegator.new(this.tribe.address, beneficiaryAddress1, this.window, {gas: 8000000, from: beneficiaryAddress1});
    this.totalTribe = new BN('10000');
    await this.tribe.mint(this.delegator.address, this.totalTribe);
  });

  describe('Init', function() {
    it('lockedToken', async function() {
      expect(await this.delegator.lockedToken()).to.be.equal(this.tribe.address);
    });

    it('totalToken', async function() {
      expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.totalTribe);
    });

    it('should delegate voting power to beneficiary', async function() {
      expect(await this.tribe.getCurrentVotes(beneficiaryAddress1)).to.be.bignumber.equal(this.totalTribe);
    });
  });

  describe('Release', function() {
    describe('Before cliff', function() {
      it('reverts', async function() {
        await time.increase((await this.delegator.cliffSeconds()).sub(new BN(1000)));
        await expectRevert(this.delegator.release(beneficiaryAddress1, '100', {from: beneficiaryAddress1}), 'TokenTimelock: Cliff not passed');
      });
    });

    describe('After cliff', function() {
      it('releases tokens', async function() {
        await time.increase((await this.delegator.cliffSeconds()).add(new BN(1)));
        await this.delegator.release(beneficiaryAddress1, '1', {from: beneficiaryAddress1});
        expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal('1');
      });
    });

    describe('Zero', function() {
      it('reverts', async function() {
        await expectRevert(this.delegator.release(beneficiaryAddress1, '0', {from: beneficiaryAddress1}), 'TokenTimelock: no amount desired');
      });
    });

    describe('One Quarter (1/4)', function() {
      beforeEach(async function() {
        this.quarter = this.window.div(new BN(4));
        await time.increase(this.quarter);
        this.alreadyClaimed = new BN(0); // 0
        this.available = this.totalTribe.div(new BN(16)); // (1*1)/(4*4)
        this.remainingBalance = this.totalTribe.sub(this.available);
        expectEvent(
          await this.delegator.release(beneficiaryAddress1, this.available, {from: beneficiaryAddress1}),
          'Release',
          {
            _beneficiary: beneficiaryAddress1,
            _recipient: beneficiaryAddress1,
            _amount: this.available
          }
        );
      });
      it('releases tokens', async function() {
        expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.remainingBalance);
        expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(this.available);
      });

      it('updates released amounts', async function() {
        expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.available);
        expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(new BN(0));
      });

      describe('Another Quarter (2/4)', function() {
        beforeEach(async function() {
          await time.increase(this.quarter);
          this.alreadyClaimed = await this.delegator.alreadyReleasedAmount();
          this.available = this.totalTribe.div(new BN(4)); // (2*2)/(4*4)
          this.remainingBalance = this.totalTribe.sub(this.available);
          expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(this.available.sub(this.alreadyClaimed));
          await this.delegator.release(beneficiaryAddress1, this.available.sub(this.alreadyClaimed), {from: beneficiaryAddress1});
        });
        it('releases tokens', async function() {
          expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.remainingBalance);
          expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(this.available);
        });

        it('updates released amounts', async function() {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.available);
        });

        describe('ReleaseMax Another Quarter (3/4)', function() {
          beforeEach(async function() {
            await time.increase(this.quarter);
            this.alreadyClaimed = await this.delegator.alreadyReleasedAmount();
            this.available = this.totalTribe.mul(new BN(9)).div(new BN(16)); // (3*3)/(4*4)
            this.remainingBalance = this.totalTribe.sub(this.available);
            expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(this.available.sub(this.alreadyClaimed));
            await this.delegator.releaseMax(beneficiaryAddress1, {from: beneficiaryAddress1});
          });
          it('releases tokens', async function() {
            expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.remainingBalance);
            expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(this.available);
          });

          it('updates released amounts', async function() {
            expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.available);
          });
        });
      });

      describe('Excess Release', function() {
        it('reverts', async function() {
          await time.increase(this.quarter);
          await expectRevert(this.delegator.release(beneficiaryAddress1, this.totalTribe, {from: beneficiaryAddress1}), 'TokenTimelock: not enough released tokens');
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

  describe('Token Drop', function() {
    beforeEach(async function() {
      await this.tribe.mint(this.delegator.address, 10000);
    });

    it('updates total token', async function() {
      expect(await this.delegator.totalToken()).to.be.bignumber.equal(new BN(20000));
    });
  });

  describe('Access', function() {
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
        await expectRevert(this.delegator.setPendingBeneficiary(userAddress, {from: userAddress}), 'TokenTimelock: Caller is not a beneficiary');
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

      it('should transfer voting power to new beneficiary', async function() {
        expect(await this.tribe.getCurrentVotes(userAddress)).to.be.bignumber.equal('0');

        await this.delegator.setPendingBeneficiary(userAddress, {from: beneficiaryAddress1});
        expectEvent(
          await this.delegator.acceptBeneficiary({from: userAddress}),
          'BeneficiaryUpdate',
          {_beneficiary: userAddress}
        );
        expect(await this.delegator.beneficiary()).to.be.equal(userAddress);

        expect(await this.tribe.getCurrentVotes(userAddress)).to.be.bignumber.equal(this.totalTribe);
      });

      it('Non pending beneficiary reverts', async function() {
        await expectRevert(this.delegator.acceptBeneficiary({from: secondUserAddress}), 'TokenTimelock: Caller is not pending beneficiary');
      });
    });

    describe('Release', function() {
      it('Non-beneficiary set reverts', async function() {
        await expectRevert(this.delegator.release(userAddress, '100', {from: userAddress}), 'TokenTimelock: Caller is not a beneficiary');
      });
    });

    describe('Clawback', function() {
      it('Non-Clawback Admin set reverts', async function() {
        await expectRevert(this.delegator.clawback({from: userAddress}), 'TokenTimelock: Only clawbackAdmin');
      });
      it('Clawback Admin set success', async function() {
        const clawbackAdmin = await this.delegator.clawbackAdmin();
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [clawbackAdmin]
        });
        await this.delegator.clawback({from: clawbackAdmin});
      });
    });
  });

  describe('Clawback', function() {
    beforeEach(async function() {
      this.clawbackAdmin = await this.delegator.clawbackAdmin();
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [this.clawbackAdmin]
      });
    });
    it('Before cliff gets back all tokens', async function() {
      const cliffSeconds = await this.delegator.cliffSeconds();
      await time.increase(cliffSeconds.sub(new BN(1000)));
      expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(new BN(10000));
      await this.delegator.clawback({from: this.clawbackAdmin});
      expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(new BN(0));
      expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(new BN(0));
      expect(await this.tribe.balanceOf(this.clawbackAdmin)).to.be.bignumber.equal(new BN(10000));
    });
    it('after cliff gets back some tokens, release others to beneficiary', async function() {
      const cliffSeconds = await this.delegator.cliffSeconds();
      await time.increase(cliffSeconds.add(new BN(1000)));
      expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(new BN(10000));
      await this.delegator.clawback({from: this.clawbackAdmin});
      expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(new BN(38));
      expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(new BN(0));
      expect(await this.tribe.balanceOf(this.clawbackAdmin)).to.be.bignumber.equal(new BN(9962));
    });
  });
});
