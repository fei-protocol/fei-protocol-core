import { expectRevert, balance, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers, artifacts } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { join } from 'path/posix';

const toBN = ethers.BigNumber.from;

const MockTribalChief = artifacts.readArtifactSync('MockTribalChief');
const MockRewardsDistributor = artifacts.readArtifactSync('MockRewardsDistributor');

const RewardsDistributorAdmin = artifacts.readArtifactSync('RewardsDistributorAdmin');
const AutoRewardsDistributor = artifacts.readArtifactSync('AutoRewardsDistributor');

describe('AutoRewardsDistributor', function () {
  let userAddress: string;
  let minterAddress: string;
  let pcvControllerAddress: string;
  let governorAddress: string;
  const e18 = '000000000000000000';

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.secondUserAddress,
      addresses.minterAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.genesisGroup,
      addresses.beneficiaryAddress1,
      addresses.beneficiaryAddress2,
      addresses.guardianAddress,
      addresses.burnerAddress
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
    ({ userAddress, pcvControllerAddress, governorAddress, minterAddress } = await getAddresses());


    this.poolIndex = 1000;
    this.poolAllocPoints = 1000;
    this.totalAllocPoint = 10000;
    this.tribePerBlock = '75' + e18;
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
      expect(await this.autoRewardsDistributor.rewardsDistributorAdmin())
        .to.be.equal(this.rewardsDistributor.address);
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

    describe('Not Paused', function () {
      it('succeeds and sets correct borrow speed', async function () {
        expect(await this.rewardsDistributor.compSupplySpeed()).to.be.equal(toBN('0'));
        
        let [newCompSpeed, updateNeeded] = await this.autoRewardsDistributor.getRewardSpeedDifference();
        const expectedNewCompSpeed = toBN('75' + e18).mul(toBN(this.poolAllocPoints)).div(toBN(this.totalAllocPoint));
        expect(newCompSpeed).to.be.equal(expectedNewCompSpeed);
        await this.autoRewardsDistributor.setAutoRewardsDistribution();
        expect(await this.rewardsDistributor.compSupplySpeed()).to.be.equal(toBN(newCompSpeed));
      });

      it('returns new compSpeed when update is needed', async function () {
        let [compsSpeed, updateNeeded] = await this.autoRewardsDistributor.getRewardSpeedDifference();
        
      });

      it('fails when update is not needed', async function () {
        const expectedNewCompSpeed = toBN('75' + e18).mul(toBN(this.poolAllocPoints)).div(toBN(this.totalAllocPoint));
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
  });
});
