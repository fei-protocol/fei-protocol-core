import { expectRevert } from '../../helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { MockPauserV2 } from '@custom-types/contracts';

describe('PauserV2', function () {
  let pauseContract: MockPauserV2;

  beforeEach(async function () {
    pauseContract = await (await ethers.getContractFactory('MockPauserV2')).deploy();
  });

  describe('init', function () {
    it('is unpaused on construction', async function () {
      expect(await pauseContract.secondaryPaused()).to.be.false;
    });
  });

  describe('pause', function () {
    describe('whenNotSecondaryPaused', function () {
      beforeEach(async function () {
        await pauseContract.pause();
      });

      it('contract is in correct state', async function () {
        expect(await pauseContract.secondaryPaused()).to.be.true;
      });

      it('is able to pause and modifier throws error when paused function is accessed', async function () {
        await expectRevert(pauseContract.failsWhenPaused(), 'PauserV2: paused');
      });

      it('is able to call fails when not paused', async function () {
        await pauseContract.failsWhenNotPaused();
      });
    });

    it('is able to unpause and modifier throws error when unpaused function is accessed', async function () {
      await expectRevert(pauseContract.failsWhenNotPaused(), 'PauserV2: not paused');
    });
  });

  describe('unpause', function () {
    it('contract is in correct state', async function () {
      expect(await pauseContract.secondaryPaused()).to.be.false;
    });

    describe('whenNotSecondaryPaused', function () {
      it('is able to call failswhenpaused when pool is unpaused', async function () {
        await pauseContract.failsWhenPaused();
      });
    });

    describe('whenSecondaryPaused', function () {
      it('is able to unpause and modifier throws error when unpaused function is accessed', async function () {
        await expectRevert(pauseContract.failsWhenNotPaused(), 'PauserV2: not paused');
      });
    });
  });
});
