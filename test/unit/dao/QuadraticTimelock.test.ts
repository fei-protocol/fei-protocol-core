import { expectEvent, expectRevert, getAddresses, getImpersonatedSigner, time } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

describe.only('QuadraticTimelockedDelegator', function () {
  let userAddress;
  let secondUserAddress;
  let beneficiaryAddress1;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.secondUserAddress, addresses.beneficiaryAddress1];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, secondUserAddress, beneficiaryAddress1 } = await getAddresses());

    this.tribe = await (await ethers.getContractFactory('MockTribe')).deploy();

    this.window = toBN(4 * 365 * 24 * 60 * 60);
    this.delegator = await (
      await ethers.getContractFactory('QuadraticTimelockedDelegator')
    ).deploy(this.tribe.address, userAddress, this.window);
    this.totalTribe = toBN('10000');
    await this.tribe.mint(this.delegator.address, this.totalTribe);
  });

  describe('Init', function () {
    it('lockedToken', async function () {
      expect(await this.delegator.lockedToken()).to.be.equal(this.tribe.address);
    });

    it('totalToken', async function () {
      expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.totalTribe);
    });

    it('should delegate voting power to beneficiary', async function () {
      expect(await this.tribe.getCurrentVotes(userAddress)).to.be.bignumber.equal(this.totalTribe);
    });
  });

  describe('Release', function () {
    describe('Before cliff', function () {
      it('reverts', async function () {
        await time.increase((await this.delegator.cliffSeconds()).sub(toBN(1000)));
        await expectRevert(this.delegator.release(userAddress, '100'), 'TokenTimelock: Cliff not passed');
      });
    });

    describe('After cliff', function () {
      it('releases tokens', async function () {
        await time.increase((await this.delegator.cliffSeconds()).add(toBN(1)));
        await this.delegator.release(userAddress, '1');
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('1'));
      });
    });

    describe('Zero', function () {
      it('reverts', async function () {
        await expectRevert(this.delegator.release(userAddress, '0'), 'TokenTimelock: no amount desired');
      });
    });

    describe('One Quarter (1/4)', function () {
      beforeEach(async function () {
        this.quarter = this.window.div(toBN(4));
        await time.increase(this.quarter);
        this.alreadyClaimed = toBN(0); // 0
        this.available = this.totalTribe.div(toBN(16)); // (1*1)/(4*4)
        this.remainingBalance = this.totalTribe.sub(this.available);
        expectEvent(await this.delegator.release(userAddress, this.available), this.delegator, 'Release', [
          userAddress,
          userAddress,
          this.available
        ]);
      });
      it('releases tokens', async function () {
        expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.remainingBalance);
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.available);
      });

      it('updates released amounts', async function () {
        expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.available);
        expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(toBN(0));
      });

      describe('Another Quarter (2/4)', function () {
        beforeEach(async function () {
          await time.increase(this.quarter);
          this.alreadyClaimed = await this.delegator.alreadyReleasedAmount();
          this.available = this.totalTribe.div(toBN(4)); // (2*2)/(4*4)
          this.remainingBalance = this.totalTribe.sub(this.available);
          expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(
            this.available.sub(this.alreadyClaimed)
          );
          await this.delegator.release(userAddress, this.available.sub(this.alreadyClaimed));
        });
        it('releases tokens', async function () {
          expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.remainingBalance);
          expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.available);
        });

        it('updates released amounts', async function () {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.available);
        });

        describe('ReleaseMax Another Quarter (3/4)', function () {
          beforeEach(async function () {
            await time.increase(this.quarter);
            this.alreadyClaimed = await this.delegator.alreadyReleasedAmount();
            this.available = this.totalTribe.mul(toBN(9)).div(toBN(16)); // (3*3)/(4*4)
            this.remainingBalance = this.totalTribe.sub(this.available);
            expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(
              this.available.sub(this.alreadyClaimed)
            );
            await this.delegator.releaseMax(userAddress);
          });
          it('releases tokens', async function () {
            expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.remainingBalance);
            expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.available);
          });

          it('updates released amounts', async function () {
            expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.available);
          });
        });
      });

      describe('Excess Release', function () {
        it('reverts', async function () {
          await time.increase(this.quarter);
          await expectRevert(
            this.delegator.release(userAddress, this.totalTribe),
            'TokenTimelock: not enough released tokens'
          );
        });
      });
    });

    describe('Total Window', function () {
      beforeEach(async function () {
        await time.increase(this.window);
      });

      describe('Total Release', function () {
        beforeEach(async function () {
          expectEvent(await this.delegator.release(userAddress, this.totalTribe), this.delegator, 'Release', [
            userAddress,
            userAddress,
            this.totalTribe
          ]);
        });

        it('releases tokens', async function () {
          expect(await this.delegator.totalToken()).to.be.bignumber.equal(toBN(0));
          expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.totalTribe);
        });

        it('updates released amounts', async function () {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.totalTribe);
          expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(toBN(0));
        });
      });

      describe.skip('Release To', function () {
        beforeEach(async function () {
          expectEvent(await this.delegator.release(userAddress, this.totalTribe), this.delegator, 'Release', [
            userAddress,
            userAddress,
            this.totalTribe
          ]);
        });

        it('releases tokens', async function () {
          expect(await this.delegator.totalToken()).to.be.bignumber.equal(toBN(0));
          expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.totalTribe);
          expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN(0));
        });

        it('updates released amounts', async function () {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.totalTribe);
          expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(toBN(0));
        });
      });

      describe('Partial Release', function () {
        beforeEach(async function () {
          this.halfAmount = this.totalTribe.div(toBN(2));
          expectEvent(await this.delegator.release(userAddress, this.halfAmount), this.delegator, 'Release', [
            userAddress,
            userAddress,
            this.halfAmount
          ]);
        });

        it('releases tokens', async function () {
          expect(await this.delegator.totalToken()).to.be.bignumber.equal(this.halfAmount);
          expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.halfAmount);
        });

        it('updates released amounts', async function () {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.bignumber.equal(this.halfAmount);
          expect(await this.delegator.availableForRelease()).to.be.bignumber.equal(this.halfAmount);
        });
      });
    });
  });

  describe('Token Drop', function () {
    beforeEach(async function () {
      await this.tribe.mint(this.delegator.address, 10000);
    });

    it('updates total token', async function () {
      expect(await this.delegator.totalToken()).to.be.bignumber.equal(toBN(20000));
    });
  });

  describe('Access', function () {
    describe('Set Pending Beneficiary', function () {
      it('Beneficiary set succeeds', async function () {
        expectEvent(
          await this.delegator.setPendingBeneficiary(userAddress),
          this.delegator,
          'PendingBeneficiaryUpdate',
          [userAddress]
        );
        expect(await this.delegator.pendingBeneficiary()).to.be.equal(userAddress);
      });

      it('Non-beneficiary set reverts', async function () {
        await expectRevert(
          this.delegator.connect(impersonatedSigners[beneficiaryAddress1]).setPendingBeneficiary(userAddress),
          'TokenTimelock: Caller is not a beneficiary'
        );
      });
    });

    describe.skip('Accept Beneficiary', function () {
      it('Pending Beneficiary succeeds', async function () {
        await this.delegator.setPendingBeneficiary(userAddress);
        expectEvent(
          await this.delegator.connect(impersonatedSigners[userAddress]).acceptBeneficiary(),
          this.delegator,
          'BeneficiaryUpdate',
          [userAddress]
        );
        expect(await this.delegator.beneficiary()).to.be.equal(userAddress);
      });

      it('should transfer voting power to new beneficiary', async function () {
        expect(await this.tribe.getCurrentVotes(userAddress)).to.be.bignumber.equal(toBN('0'));

        await this.delegator.setPendingBeneficiary(userAddress);
        expectEvent(
          await this.delegator.connect(impersonatedSigners[userAddress]).acceptBeneficiary(),
          this.delegator,
          'BeneficiaryUpdate',
          [userAddress]
        );
        expect(await this.delegator.beneficiary()).to.be.equal(userAddress);

        expect(await this.tribe.getCurrentVotes(userAddress)).to.be.bignumber.equal(this.totalTribe);
      });

      it('Non pending beneficiary reverts', async function () {
        await expectRevert(
          this.delegator.connect(impersonatedSigners[secondUserAddress]).acceptBeneficiary(),
          'TokenTimelock: Caller is not pending beneficiary'
        );
      });
    });

    describe('Release', function () {
      it('Non-beneficiary set reverts', async function () {
        await expectRevert(
          this.delegator.connect(impersonatedSigners[beneficiaryAddress1]).release(userAddress, '100'),
          'TokenTimelock: Caller is not a beneficiary'
        );
      });
    });

    describe.skip('Clawback', function () {
      it('Non-Clawback Admin set reverts', async function () {
        await expectRevert(
          this.delegator.connect(impersonatedSigners[userAddress]).clawback(),
          'TokenTimelock: Only clawbackAdmin'
        );
      });
      it('Clawback Admin set success', async function () {
        const clawbackAdmin = await this.delegator.clawbackAdmin();
        await this.delegator.connect(await getImpersonatedSigner(clawbackAdmin)).clawback();
      });
    });
  });

  describe.skip('Clawback', function () {
    beforeEach(async function () {
      this.clawbackAdmin = await this.delegator.clawbackAdmin();
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [this.clawbackAdmin]
      });
    });
    it('Before cliff gets back all tokens', async function () {
      const cliffSeconds = await this.delegator.cliffSeconds();
      await time.increase(cliffSeconds.sub(toBN(1000)));
      expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(toBN(10000));
      await this.delegator.connect(await getImpersonatedSigner(this.clawbackAdmin)).clawback();
      expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN(0));
      expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(toBN(0));
      expect(await this.tribe.balanceOf(this.clawbackAdmin)).to.be.bignumber.equal(toBN(10000));
    });
    it('after cliff gets back some tokens, release others to beneficiary', async function () {
      const cliffSeconds = await this.delegator.cliffSeconds();
      await time.increase(cliffSeconds.add(toBN(1000)));
      expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(toBN(10000));
      await this.delegator.connect(await getImpersonatedSigner(this.clawbackAdmin)).clawback();
      expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN(38));
      expect(await this.tribe.balanceOf(this.delegator.address)).to.be.bignumber.equal(toBN(0));
      expect(await this.tribe.balanceOf(this.clawbackAdmin)).to.be.bignumber.equal(toBN(9962));
    });
  });
});
