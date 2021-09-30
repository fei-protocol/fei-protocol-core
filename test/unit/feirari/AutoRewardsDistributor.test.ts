import { expectRevert, balance, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers, artifacts } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

const MockTribalChief = artifacts.readArtifactSync('MockTribalChief');
const MockRewardsDistributor = artifacts.readArtifactSync('MockRewardsDistributor');
const AutoRewardsDistributor = artifacts.readArtifactSync('AutoRewardsDistributor');

describe('AutoRewardsDistributor', function () {
  let governorAddress: string;
  const e18 = '000000000000000000';

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.governorAddress,
    ];

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


    this.poolIndex = 1000;
    this.poolAllocPoints = 1000;
    this.totalAllocPoint = 10000;
    this.tribePerBlock = `75${e18}`;
    this.isBorrowIncentivized = false;

    this.core = await getCore();
    this.tribalChief = await (await ethers.getContractFactory('MockTribalChief')).deploy(
      this.tribePerBlock,
      this.totalAllocPoint,
      this.poolAllocPoints
    );
    this.tribe = await ethers.getContractAt('Tribe', await this.core.tribe());
    this.rewardsDistributor = await (await ethers.getContractFactory('MockRewardsDistributor')).deploy();

    this.autoRewardsDistributor = await (await ethers.getContractFactory('AutoRewardsDistributor'))
        .deploy(
          this.core.address,
          this.rewardsDistributor.address,
          this.tribalChief.address,
          this.poolIndex,
          this.tribe.address,
          this.isBorrowIncentivized
        );

    await this.rewardsDistributor.transferOwnership(this.autoRewardsDistributor.address);
  });

  describe('Init', function () {
    it('rewardsDistributorAdmin', async function () {
      expect(await this.autoRewardsDistributor.rewardsDistributorAdmin()).to.be.equal(this.rewardsDistributor.address);
    });

    it('tribalChief', async function () {
      expect(await this.autoRewardsDistributor.tribalChief()).to.be.equal(this.tribalChief.address);
    });
    
    it('cTokenAddress', async function () {
      expect(await this.autoRewardsDistributor.cTokenAddress()).to.be.equal(this.tribe.address);
    });
    
    it('isBorrowIncentivized', async function () {
      expect(await this.autoRewardsDistributor.isBorrowIncentivized()).to.be.equal(this.isBorrowIncentivized);
    });
    
    it('tribalChiefRewardIndex', async function () {
      expect(await this.autoRewardsDistributor.tribalChiefRewardIndex()).to.be.equal(toBN(this.poolIndex));
    });

    it('supplySpeeds', async function () {
      expect(await this.rewardsDistributor.compSupplySpeed()).to.be.equal(toBN('0'));
      expect(await this.rewardsDistributor.compSupplySpeeds(this.tribe.address)).to.be.equal(toBN('0'));
    });
    
    it('borrowSpeeds', async function () {
      expect(await this.rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN('0'));
      expect(await this.rewardsDistributor.compBorrowSpeeds(this.tribe.address)).to.be.equal(toBN('0'));
    });
    
    it('tribePerBlock', async function () {
      expect(await this.tribalChief.tribePerBlock()).to.be.equal(toBN(this.tribePerBlock));
    });
    
    it('totalAllocPoint', async function () {
      expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN(this.totalAllocPoint));
    });
    
    it('poolAllocPoints', async function () {
      expect(await this.tribalChief.poolAllocPoints()).to.be.equal(toBN(this.poolAllocPoints));
    });
  });

  describe('setAutoRewardsDistribution', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        let governor = await ethers.getSigner(governorAddress);

        expect(await this.autoRewardsDistributor.paused()).to.be.false;
        await this.autoRewardsDistributor.connect(governor).pause();
        expect(await this.autoRewardsDistributor.paused()).to.be.true;
        await expectRevert(this.autoRewardsDistributor.setAutoRewardsDistribution(), 'Pausable: paused');
      });
    });

    describe('Not Paused, Supply', function () {
      it('succeeds and sets correct supply speed', async function () {
        expect(await this.rewardsDistributor.compSupplySpeed()).to.be.equal(toBN('0'));
        
        let [newCompSpeed, updateNeeded] = await this.autoRewardsDistributor.getRewardSpeedDifference();
        const expectedNewCompSpeed = toBN(`75${e18}`).mul(toBN(this.poolAllocPoints)).div(toBN(this.totalAllocPoint));
        expect(newCompSpeed).to.be.equal(expectedNewCompSpeed);
        expect(updateNeeded).to.be.true;
        await this.autoRewardsDistributor.setAutoRewardsDistribution();
        expect(await this.rewardsDistributor.compSupplySpeed()).to.be.equal(toBN(newCompSpeed));
      });

      it('fails when update is not needed', async function () {
        const expectedNewCompSpeed = toBN(`75${e18}`).mul(toBN(this.poolAllocPoints)).div(toBN(this.totalAllocPoint));
        await this.rewardsDistributor.setCompSupplySpeed(expectedNewCompSpeed);
        let [compSpeed, updateNeeded] = await this.autoRewardsDistributor.getRewardSpeedDifference();
        expect(updateNeeded).to.be.false;
        expect(compSpeed).to.be.equal(expectedNewCompSpeed);

        await expectRevert(
          this.autoRewardsDistributor.setAutoRewardsDistribution(),
          "AutoRewardsDistributor: update not needed"
        );
      });
    });

    describe('Not Paused, Borrow', function () {
      beforeEach(async function () {
        this.isBorrowIncentivized = true;

        this.core = await getCore();
        this.tribalChief = await (await ethers.getContractFactory('MockTribalChief')).deploy(
          this.tribePerBlock,
          this.totalAllocPoint,
          this.poolAllocPoints
        );
        this.tribe = await ethers.getContractAt('Tribe', await this.core.tribe());
        this.rewardsDistributor = await (await ethers.getContractFactory('MockRewardsDistributor')).deploy();
    
        this.autoRewardsDistributor = await (await ethers.getContractFactory('AutoRewardsDistributor'))
            .deploy(
              this.core.address,
              this.rewardsDistributor.address,
              this.tribalChief.address,
              this.poolIndex,
              this.tribe.address,
              this.isBorrowIncentivized
            );
    
        await this.rewardsDistributor.transferOwnership(this.autoRewardsDistributor.address);
      });

      it('succeeds and sets correct borrow speed', async function () {
        expect(await this.rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN('0'));
        
        let [newCompSpeed, updateNeeded] = await this.autoRewardsDistributor.getRewardSpeedDifference();
        const expectedNewCompSpeed = toBN(`75${e18}`).mul(toBN(this.poolAllocPoints)).div(toBN(this.totalAllocPoint));
        expect(newCompSpeed).to.be.equal(expectedNewCompSpeed);
        expect(updateNeeded).to.be.true;
        await this.autoRewardsDistributor.setAutoRewardsDistribution();
        expect(await this.rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN(newCompSpeed));
      });

      it('fails when update is not needed', async function () {
        const expectedNewCompSpeed = toBN(`75${e18}`).mul(toBN(this.poolAllocPoints)).div(toBN(this.totalAllocPoint));
        await this.rewardsDistributor.setCompBorrowSpeed(expectedNewCompSpeed);

        let [compSpeed, updateNeeded] = await this.autoRewardsDistributor.getRewardSpeedDifference();
        expect(updateNeeded).to.be.false;
        expect(compSpeed).to.be.equal(expectedNewCompSpeed);

        await expectRevert(
          this.autoRewardsDistributor.setAutoRewardsDistribution(),
          "AutoRewardsDistributor: update not needed"
        );
      });
    });
  });

  describe('getRewardSpeedDifference', function () {
    it('returns 0 and does not revert when tribe per block is 0', async function () {
      await this.tribalChief.setTribePerBlock(0);
      let [newCompSpeed, updateNeeded] = await this.autoRewardsDistributor.getRewardSpeedDifference();
      expect(updateNeeded).to.be.false;
      expect(newCompSpeed).to.be.equal(toBN('0'));
    });

    it('returns 0 and does not revert when total alloc points are 0', async function () {
      await this.tribalChief.setTotalAllocPoint(0);
      let [newCompSpeed, updateNeeded] = await this.autoRewardsDistributor.getRewardSpeedDifference();
      expect(updateNeeded).to.be.false;
      expect(newCompSpeed).to.be.equal(toBN('0'));
    });

    it('returns 0 and does not revert when pool alloc points are 0', async function () {
      await this.tribalChief.setPoolAllocPoints(0);
      let [newCompSpeed, updateNeeded] = await this.autoRewardsDistributor.getRewardSpeedDifference();
      expect(updateNeeded).to.be.false;
      expect(newCompSpeed).to.be.equal(toBN('0'));
    });
  });

  describe('ACL', function () {
    describe('setAutoRewardsDistribution', function () {
      it('fails when caller is not governor', async function () {
        await expectRevert(
          this.autoRewardsDistributor.setRewardsDistributorAdmin(this.tribe.address),
          "CoreRef: Caller is not a governor or contract admin"
        );
      });
        
      it('succeeds when caller is governor', async function () {
        let governor = await ethers.getSigner(governorAddress);

        await this.autoRewardsDistributor.connect(governor).setRewardsDistributorAdmin(this.tribe.address);
        expect(await this.autoRewardsDistributor.rewardsDistributorAdmin()).to.be.equal(this.tribe.address);
      });
    });
  });
});
