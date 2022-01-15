import { expectRevert, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer, BigNumber } from 'ethers';
import { AutoRewardsDistributor } from '../../../types/contracts/AutoRewardsDistributor';
import { MockRewardsDistributor } from '../../../types/contracts/MockRewardsDistributor';
import { MockTribalChief } from '../../../types/contracts/MockTribalChief';
import { Core } from '../../../types/contracts/Core';
import { Tribe } from '../../../types/contracts/Tribe';

const toBN = ethers.BigNumber.from;

describe('AutoRewardsDistributor', function () {
  let governorAddress: string;
  let poolIndex: number;
  let poolAllocPoints: number;
  let totalAllocPoint: number;
  let tribePerBlock: BigNumber;
  let autoRewardsDistributor: AutoRewardsDistributor;
  let tribalChief: MockTribalChief;
  let rewardsDistributor: MockRewardsDistributor;
  let core: Core;
  let tribe: Tribe;
  let isBorrowIncentivized: boolean;

  const e18 = ethers.constants.WeiPerEther;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.governorAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ governorAddress } = await getAddresses());

    poolIndex = 1000;
    poolAllocPoints = 1000;
    totalAllocPoint = 10000;
    tribePerBlock = toBN('75').mul(toBN(e18));
    isBorrowIncentivized = false;

    core = (await getCore()) as Core;
    tribalChief = await (
      await ethers.getContractFactory('MockTribalChief')
    ).deploy(tribePerBlock, totalAllocPoint, poolAllocPoints);
    tribe = await ethers.getContractAt('Tribe', await core.tribe());
    rewardsDistributor = await (await ethers.getContractFactory('MockRewardsDistributor')).deploy();

    autoRewardsDistributor = await (
      await ethers.getContractFactory('AutoRewardsDistributor')
    ).deploy(
      core.address,
      rewardsDistributor.address,
      tribalChief.address,
      poolIndex,
      tribe.address,
      isBorrowIncentivized
    );

    await rewardsDistributor.transferOwnership(autoRewardsDistributor.address);
  });

  describe('Init', function () {
    it('rewardsDistributorAdmin', async function () {
      expect(await autoRewardsDistributor.rewardsDistributorAdmin()).to.be.equal(rewardsDistributor.address);
    });

    it('tribalChief', async function () {
      expect(await autoRewardsDistributor.tribalChief()).to.be.equal(tribalChief.address);
    });

    it('cTokenAddress', async function () {
      expect(await autoRewardsDistributor.cTokenAddress()).to.be.equal(tribe.address);
    });

    it('isBorrowIncentivized', async function () {
      expect(await autoRewardsDistributor.isBorrowIncentivized()).to.be.equal(isBorrowIncentivized);
    });

    it('tribalChiefRewardIndex', async function () {
      expect(await autoRewardsDistributor.tribalChiefRewardIndex()).to.be.equal(toBN(poolIndex));
    });
  });

  describe('setAutoRewardsDistribution', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        expect(await autoRewardsDistributor.paused()).to.be.false;
        await autoRewardsDistributor.connect(impersonatedSigners[governorAddress]).pause();
        expect(await autoRewardsDistributor.paused()).to.be.true;
        await expectRevert(autoRewardsDistributor.setAutoRewardsDistribution(), 'Pausable: paused');
      });
    });

    describe('Not Paused, Supply', function () {
      it('succeeds and sets correct supply speed', async function () {
        expect(await rewardsDistributor.compSupplySpeed()).to.be.equal(toBN('0'));

        const [newCompSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();
        const expectedNewCompSpeed = toBN('75').mul(toBN(e18)).mul(toBN(poolAllocPoints)).div(toBN(totalAllocPoint));
        expect(newCompSpeed).to.be.equal(expectedNewCompSpeed);
        expect(updateNeeded).to.be.true;
        await expect(await autoRewardsDistributor.setAutoRewardsDistribution())
          .to.emit(autoRewardsDistributor, 'SpeedChanged')
          .withArgs(expectedNewCompSpeed);

        expect(await rewardsDistributor.compSupplySpeed()).to.be.equal(toBN(newCompSpeed));
      });

      it('fails when update is not needed', async function () {
        const expectedNewCompSpeed = toBN('75').mul(toBN(e18)).mul(toBN(poolAllocPoints)).div(toBN(totalAllocPoint));
        await rewardsDistributor.setCompSupplySpeed(expectedNewCompSpeed);
        const [compSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();

        expect(updateNeeded).to.be.false;
        expect(compSpeed).to.be.equal(expectedNewCompSpeed);
        await expectRevert(
          autoRewardsDistributor.setAutoRewardsDistribution(),
          'AutoRewardsDistributor: update not needed'
        );
      });
    });

    describe('Not Paused, Borrow', function () {
      beforeEach(async function () {
        isBorrowIncentivized = true;

        core = (await getCore()) as Core;
        tribalChief = await (
          await ethers.getContractFactory('MockTribalChief')
        ).deploy(tribePerBlock, totalAllocPoint, poolAllocPoints);
        tribe = await ethers.getContractAt('Tribe', await core.tribe());
        rewardsDistributor = await (await ethers.getContractFactory('MockRewardsDistributor')).deploy();

        autoRewardsDistributor = await (
          await ethers.getContractFactory('AutoRewardsDistributor')
        ).deploy(
          core.address,
          rewardsDistributor.address,
          tribalChief.address,
          poolIndex,
          tribe.address,
          isBorrowIncentivized
        );

        await rewardsDistributor.transferOwnership(autoRewardsDistributor.address);
      });

      it('succeeds and sets correct borrow speed', async function () {
        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN('0'));

        const [newCompSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();
        const expectedNewCompSpeed = toBN('75').mul(toBN(e18)).mul(toBN(poolAllocPoints)).div(toBN(totalAllocPoint));

        expect(newCompSpeed).to.be.equal(expectedNewCompSpeed);
        expect(updateNeeded).to.be.true;
        await autoRewardsDistributor.setAutoRewardsDistribution();
        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN(newCompSpeed));
      });

      it('succeeds and sets correct borrow speed with 1/2 totalAllocPoints', async function () {
        const newTotalAllocPoints = 2;
        const newPoolAllocPoints = 1;

        await tribalChief.setTotalAllocPoint(newTotalAllocPoints);
        await tribalChief.setPoolAllocPoints(newPoolAllocPoints);
        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN('0'));

        const [newCompSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();
        const expectedNewCompSpeed = toBN('75')
          .mul(toBN(e18))
          .mul(toBN(newPoolAllocPoints))
          .div(toBN(newTotalAllocPoints));

        expect(newCompSpeed).to.be.equal(expectedNewCompSpeed);
        expect(updateNeeded).to.be.true;
        await autoRewardsDistributor.setAutoRewardsDistribution();
        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN(newCompSpeed));
      });

      it('succeeds and sets correct borrow speed with 1/100 totalAllocPoints', async function () {
        const newTotalAllocPoints = 100;
        const newPoolAllocPoints = 1;

        await tribalChief.setTotalAllocPoint(newTotalAllocPoints);
        await tribalChief.setPoolAllocPoints(newPoolAllocPoints);
        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN('0'));

        const [newCompSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();
        const expectedNewCompSpeed = toBN('75')
          .mul(toBN(e18))
          .mul(toBN(newPoolAllocPoints))
          .div(toBN(newTotalAllocPoints));

        expect(newCompSpeed).to.be.equal(expectedNewCompSpeed);
        expect(updateNeeded).to.be.true;
        await autoRewardsDistributor.setAutoRewardsDistribution();
        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN(newCompSpeed));
      });

      it('succeeds and sets correct borrow speed with 1/1000 totalAllocPoints', async function () {
        const newTotalAllocPoints = 1000;
        const newPoolAllocPoints = 1;

        await tribalChief.setTotalAllocPoint(newTotalAllocPoints);
        await tribalChief.setPoolAllocPoints(newPoolAllocPoints);
        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN('0'));

        const [newCompSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();
        const expectedNewCompSpeed = toBN('75')
          .mul(toBN(e18))
          .mul(toBN(newPoolAllocPoints))
          .div(toBN(newTotalAllocPoints));

        expect(newCompSpeed).to.be.equal(expectedNewCompSpeed);
        expect(updateNeeded).to.be.true;
        await autoRewardsDistributor.setAutoRewardsDistribution();
        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN(newCompSpeed));
      });

      it('fails when update is not needed', async function () {
        const expectedNewCompSpeed = toBN('75').mul(toBN(e18)).mul(toBN(poolAllocPoints)).div(toBN(totalAllocPoint));
        await rewardsDistributor.setCompBorrowSpeed(expectedNewCompSpeed);

        const [compSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();
        expect(updateNeeded).to.be.false;
        expect(compSpeed).to.be.equal(expectedNewCompSpeed);

        await expectRevert(
          autoRewardsDistributor.setAutoRewardsDistribution(),
          'AutoRewardsDistributor: update not needed'
        );
      });
    });
  });

  describe('getNewRewardSpeed', function () {
    it('returns true and new compspeed when an update is needed', async function () {
      const expectedNewCompSpeed = toBN('75').mul(toBN(e18)).mul(toBN(poolAllocPoints)).div(toBN(totalAllocPoint));
      const [compSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();

      expect(updateNeeded).to.be.true;
      expect(compSpeed).to.be.equal(expectedNewCompSpeed);
    });

    it('returns true and new compspeed when an update is needed', async function () {
      await tribalChief.setTribePerBlock(toBN('100').mul(toBN(e18)));

      const expectedNewCompSpeed = toBN('100').mul(toBN(e18)).mul(toBN(poolAllocPoints)).div(toBN(totalAllocPoint));
      const [compSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();

      expect(updateNeeded).to.be.true;
      expect(compSpeed).to.be.equal(expectedNewCompSpeed);
    });

    it('returns 0 and does not revert when tribe per block is 0', async function () {
      await tribalChief.setTribePerBlock(0);
      const [newCompSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();

      expect(updateNeeded).to.be.false;
      expect(newCompSpeed).to.be.equal(toBN('0'));
    });

    it('returns 0 and does not revert when total alloc points are 0', async function () {
      await tribalChief.setTotalAllocPoint(0);
      const [newCompSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();

      expect(updateNeeded).to.be.false;
      expect(newCompSpeed).to.be.equal(toBN('0'));
    });

    it('returns 0 and does not revert when pool alloc points are 0', async function () {
      await tribalChief.setPoolAllocPoints(0);
      const [newCompSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();

      expect(updateNeeded).to.be.false;
      expect(newCompSpeed).to.be.equal(toBN('0'));
    });
  });

  describe('ACL', function () {
    describe('setAutoRewardsDistribution', function () {
      it('fails when caller is not governor', async function () {
        await expectRevert(
          autoRewardsDistributor.setRewardsDistributorAdmin(tribe.address),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });

      it('succeeds when caller is governor', async function () {
        expect(await autoRewardsDistributor.rewardsDistributorAdmin()).to.be.equal(rewardsDistributor.address);
        await expect(
          await autoRewardsDistributor
            .connect(impersonatedSigners[governorAddress])
            .setRewardsDistributorAdmin(tribe.address)
        )
          .to.emit(autoRewardsDistributor, 'RewardsDistributorAdminChanged')
          .withArgs(rewardsDistributor.address, tribe.address);
        expect(await autoRewardsDistributor.rewardsDistributorAdmin()).to.be.equal(tribe.address);
      });
    });
  });
});
