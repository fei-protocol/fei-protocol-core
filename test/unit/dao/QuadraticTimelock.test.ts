import { expectEvent, expectRevert, getAddresses, getImpersonatedSigner, time } from '@test/helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { forceEth } from '../../integration/setup/utils';

const toBN = ethers.BigNumber.from;

describe('QuadraticTimelockedDelegator', function () {
  let userAddress;
  let secondUserAddress;
  let beneficiaryAddress1;
  let delegator;
  let tribe;
  let window;
  let totalTribe;

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

    tribe = await (await ethers.getContractFactory('MockTribe')).deploy();

    window = toBN(4 * 365 * 24 * 60 * 60);
    delegator = await (
      await ethers.getContractFactory('QuadraticTimelockedDelegator')
    ).deploy(tribe.address, userAddress, window, 60 * 60 * 24 * 30, secondUserAddress, '0');
    totalTribe = toBN('10000');
    await tribe.mint(delegator.address, totalTribe);

    await delegator.delegate(userAddress);
  });

  describe('Init', function () {
    it('lockedToken', async function () {
      expect(await delegator.lockedToken()).to.be.equal(tribe.address);
    });

    it('totalToken', async function () {
      expect(await delegator.totalToken()).to.be.bignumber.equal(totalTribe);
    });

    it('should delegate voting power to beneficiary', async function () {
      expect(await tribe.getCurrentVotes(userAddress)).to.be.bignumber.equal(totalTribe);
    });
  });

  describe('Release', function () {
    describe('Before cliff', function () {
      it('reverts', async function () {
        await time.increase((await delegator.cliffSeconds()).sub(toBN(1000)));
        await expectRevert(delegator.release(userAddress, '100'), 'TokenTimelock: Cliff not passed');
      });
    });

    describe('After cliff', function () {
      it('releases tokens', async function () {
        await time.increase((await delegator.cliffSeconds()).add(toBN(1)));
        await delegator.release(userAddress, '1');
        expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('1'));
      });
    });

    describe('Zero', function () {
      it('reverts', async function () {
        await expectRevert(delegator.release(userAddress, '0'), 'TokenTimelock: no amount desired');
      });
    });

    describe('One Quarter (1/4)', function () {
      let quarter;
      let alreadyClaimed;
      let available;
      let remainingBalance;

      beforeEach(async function () {
        quarter = window.div(toBN(4));
        await time.increase(quarter);
        alreadyClaimed = toBN(0); // 0
        available = totalTribe.div(toBN(16)); // (1*1)/(4*4)
        remainingBalance = totalTribe.sub(available);
        expectEvent(await delegator.release(userAddress, available), delegator, 'Release', [
          userAddress,
          userAddress,
          available
        ]);
      });
      it('releases tokens', async function () {
        expect(await delegator.totalToken()).to.be.bignumber.equal(remainingBalance);
        expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(available);
      });

      it('updates released amounts', async function () {
        expect(await delegator.alreadyReleasedAmount()).to.be.bignumber.equal(available);
        expect(await delegator.availableForRelease()).to.be.bignumber.equal(toBN(0));
      });

      describe('Another Quarter (2/4)', function () {
        beforeEach(async function () {
          await time.increase(quarter);
          alreadyClaimed = await delegator.alreadyReleasedAmount();
          available = totalTribe.div(toBN(4)); // (2*2)/(4*4)
          remainingBalance = totalTribe.sub(available);
          expect(await delegator.availableForRelease()).to.be.bignumber.equal(available.sub(alreadyClaimed));
          await delegator.release(userAddress, available.sub(alreadyClaimed));
        });
        it('releases tokens', async function () {
          expect(await delegator.totalToken()).to.be.bignumber.equal(remainingBalance);
          expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(available);
        });

        it('updates released amounts', async function () {
          expect(await delegator.alreadyReleasedAmount()).to.be.bignumber.equal(available);
        });

        describe('ReleaseMax Another Quarter (3/4)', function () {
          beforeEach(async function () {
            await time.increase(quarter);
            alreadyClaimed = await delegator.alreadyReleasedAmount();
            available = totalTribe.mul(toBN(9)).div(toBN(16)); // (3*3)/(4*4)
            remainingBalance = totalTribe.sub(available);
            expect(await delegator.availableForRelease()).to.be.bignumber.equal(available.sub(alreadyClaimed));
            await delegator.releaseMax(userAddress);
          });
          it('releases tokens', async function () {
            expect(await delegator.totalToken()).to.be.bignumber.equal(remainingBalance);
            expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(available);
          });

          it('updates released amounts', async function () {
            expect(await delegator.alreadyReleasedAmount()).to.be.bignumber.equal(available);
          });
        });
      });

      describe('Excess Release', function () {
        it('reverts', async function () {
          await time.increase(quarter);
          await expectRevert(delegator.release(userAddress, totalTribe), 'TokenTimelock: not enough released tokens');
        });
      });
    });

    describe('Total Window', function () {
      beforeEach(async function () {
        await time.increase(window);
      });

      describe('Total Release', function () {
        beforeEach(async function () {
          expectEvent(await delegator.release(userAddress, totalTribe), delegator, 'Release', [
            userAddress,
            userAddress,
            totalTribe
          ]);
        });

        it('releases tokens', async function () {
          expect(await delegator.totalToken()).to.be.bignumber.equal(toBN(0));
          expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(totalTribe);
        });

        it('updates released amounts', async function () {
          expect(await delegator.alreadyReleasedAmount()).to.be.bignumber.equal(totalTribe);
          expect(await delegator.availableForRelease()).to.be.bignumber.equal(toBN(0));
        });
      });

      describe('Release To', function () {
        beforeEach(async function () {
          expectEvent(await delegator.release(userAddress, totalTribe), delegator, 'Release', [
            userAddress,
            userAddress,
            totalTribe
          ]);
        });

        it('releases tokens', async function () {
          expect(await delegator.totalToken()).to.be.bignumber.equal(toBN(0));
          expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(totalTribe);
        });

        it('updates released amounts', async function () {
          expect(await delegator.alreadyReleasedAmount()).to.be.bignumber.equal(totalTribe);
          expect(await delegator.availableForRelease()).to.be.bignumber.equal(toBN(0));
        });
      });

      describe('Partial Release', function () {
        let halfAmount;

        beforeEach(async function () {
          halfAmount = totalTribe.div(toBN(2));
          expectEvent(await delegator.release(userAddress, halfAmount), delegator, 'Release', [
            userAddress,
            userAddress,
            halfAmount
          ]);
        });

        it('releases tokens', async function () {
          expect(await delegator.totalToken()).to.be.bignumber.equal(halfAmount);
          expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(halfAmount);
        });

        it('updates released amounts', async function () {
          expect(await delegator.alreadyReleasedAmount()).to.be.bignumber.equal(halfAmount);
          expect(await delegator.availableForRelease()).to.be.bignumber.equal(halfAmount);
        });
      });
    });
  });

  describe('Token Drop', function () {
    beforeEach(async function () {
      await tribe.mint(delegator.address, 10000);
    });

    it('updates total token', async function () {
      expect(await delegator.totalToken()).to.be.bignumber.equal(toBN(20000));
    });
  });

  describe('Access', function () {
    describe('Set Pending Beneficiary', function () {
      it('Beneficiary set succeeds', async function () {
        expectEvent(await delegator.setPendingBeneficiary(userAddress), delegator, 'PendingBeneficiaryUpdate', [
          userAddress
        ]);
        expect(await delegator.pendingBeneficiary()).to.be.equal(userAddress);
      });

      it('Non-beneficiary set reverts', async function () {
        await expectRevert(
          delegator.connect(impersonatedSigners[beneficiaryAddress1]).setPendingBeneficiary(userAddress),
          'TokenTimelock: Caller is not a beneficiary'
        );
      });

      describe('Accept Beneficiary', function () {
        it('Pending Beneficiary succeeds', async function () {
          await delegator.setPendingBeneficiary(userAddress);
          expectEvent(
            await delegator.connect(impersonatedSigners[userAddress]).acceptBeneficiary(),
            delegator,
            'BeneficiaryUpdate',
            [userAddress]
          );
          expect(await delegator.beneficiary()).to.be.equal(userAddress);
        });

        it('Non pending beneficiary reverts', async function () {
          await expectRevert(
            delegator.connect(impersonatedSigners[secondUserAddress]).acceptBeneficiary(),
            'TokenTimelock: Caller is not pending beneficiary'
          );
        });
      });
    });

    describe('Release', function () {
      it('Non-beneficiary set reverts', async function () {
        await expectRevert(
          delegator.connect(impersonatedSigners[secondUserAddress]).release(userAddress, '100'),
          'TokenTimelock: Caller is not a beneficiary'
        );
      });
    });

    describe('Delegate', function () {
      it('Non-beneficiary delegate reverts', async function () {
        await expectRevert(
          delegator.connect(impersonatedSigners[secondUserAddress]).release(userAddress, '100'),
          'TokenTimelock: Caller is not a beneficiary'
        );
      });
    });
  });

  describe('Clawback', function () {
    let clawbackAdmin;

    beforeEach(async function () {
      clawbackAdmin = await delegator.clawbackAdmin();
      await forceEth(clawbackAdmin);
    });
    it('Before cliff gets back all tokens', async function () {
      const cliffSeconds = await delegator.cliffSeconds();
      await time.increase(cliffSeconds.sub(toBN(1000)));
      expect(await tribe.balanceOf(delegator.address)).to.be.bignumber.equal(toBN(10000));
      await delegator.connect(await getImpersonatedSigner(clawbackAdmin)).clawback();
      expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN(0));
      expect(await tribe.balanceOf(delegator.address)).to.be.bignumber.equal(toBN(0));
      expect(await tribe.balanceOf(clawbackAdmin)).to.be.bignumber.equal(toBN(10000));
    });
    it('after cliff gets back some tokens, release others to beneficiary', async function () {
      const cliffSeconds = await delegator.cliffSeconds();
      await time.increase(cliffSeconds.add(toBN(1000)));
      expect(await tribe.balanceOf(delegator.address)).to.be.bignumber.equal(toBN(10000));
      await delegator.connect(await getImpersonatedSigner(clawbackAdmin)).clawback();
      expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN(4));
      expect(await tribe.balanceOf(delegator.address)).to.be.bignumber.equal(toBN(0));
      expect(await tribe.balanceOf(clawbackAdmin)).to.be.bignumber.equal(toBN(9996));
    });
  });
});
