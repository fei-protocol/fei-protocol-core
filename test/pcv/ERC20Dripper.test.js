/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
const {
  BN,
  time,
  getCore,
  expectEvent,
  expectRevert,
  expect,
  getAddresses,
  expectApprox,
} = require('../helpers');

const MockCore = artifacts.require('MockCore');
const Tribe = artifacts.require('MockTribe');
const MockCoreRef = artifacts.require('MockCoreRef');
const TribalChief = artifacts.require('TribalChief');
const ERC20Dripper = artifacts.require('ERC20Dripper');

const MockERC20 = artifacts.require('MockERC20');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ACC_TRIBE_PRECISION = new BN('100000000000000000000000');
const blockReward = '100000000000000000000';

// assume 35 weeks per year so that we always overfund TribalChief by 50%
const dripAmount = new BN(Math.floor(((3.154e+7 / 13) * 75) / 35)).mul(new BN(10).pow(new BN(18)));
// number of seconds between allowed drips
const dripFrequency = 604800;

describe('ERC20Dripper', () => {
  before(async () => {
    ({
      userAddress,
      secondUserAddress,
      beneficiaryAddress1,
      beneficiaryAddress2,
      minterAddress,
      burnerAddress,
      pcvControllerAddress,
      governorAddress,
      genesisGroup,
      guardianAddress,
    } = await getAddresses());

    thirdUserAddress = beneficiaryAddress1;
    fourthUserAddress = minterAddress;
    fifthUserAddress = burnerAddress;
    sixthUserAddress = pcvControllerAddress;
    seventhUserAddress = governorAddress;
    eigthUserAddress = genesisGroup;
    ninthUserAddress = guardianAddress;
    tenthUserAddress = beneficiaryAddress2;
  });

  beforeEach(async function () {
    this.core = await getCore(false);

    this.tribe = await Tribe.new();
    this.coreRef = await MockCoreRef.new(this.core.address);

    this.tribalChief = await TribalChief.new(this.core.address, this.tribe.address);
    this.dripper = await ERC20Dripper.new(
      this.core.address,
      this.tribalChief.address,
      dripFrequency,
      dripAmount,
      this.tribe.address
    );

    // 11 if max times we call drip in any given test
    await this.tribe.mint(this.dripper.address, dripAmount.mul(new BN(11)));
  });

  describe('security suite', () => {
    it('should not be able to withdraw as non PCV controller', async function () {
      const totalLockedTribe = await this.dripper.balance();
      await expectRevert(
        this.dripper.withdraw(
          this.tribalChief.address, totalLockedTribe, { from: thirdUserAddress }
        ),
        'CoreRef: Caller is not a PCV controller'
      );
    });

    it('should be able to withdraw as PCV controller', async function () {
      const totalLockedTribe = await this.dripper.balance();
      const dripperStartingBalance = await this.tribe.balanceOf(this.dripper.address);
      await this.dripper.withdraw(
        this.tribalChief.address, totalLockedTribe, { from: pcvControllerAddress }
      );
      const dripperEndingBalance = await this.tribe.balanceOf(this.dripper.address);

      expect(dripperEndingBalance).to.be.bignumber.equal(new BN(0));
      expect(dripperStartingBalance).to.be.bignumber.equal(totalLockedTribe);
    });

    it('should not be able to call drip before the timer is up', async function () {
      expect(await this.dripper.isTimeEnded()).to.be.false;
      await expectRevert(
        this.dripper.drip(),
        'Timed: time not ended'
      ); 
    });

    it('should not be able to call init twice', async function () {
      const tribalChiefStartingBalance = await this.tribe.balanceOf(this.tribalChief.address);
      await this.dripper.init();
      const tribalChiefEndingBalance = await this.tribe.balanceOf(this.tribalChief.address);
  
      expect(await this.dripper.isTimeEnded()).to.be.false;
      expect(tribalChiefStartingBalance.add(dripAmount)).to.be.bignumber.equal(tribalChiefEndingBalance);

      await expectRevert(
        this.dripper.init(),
        'Initializable: contract is already initialized'
      ); 
    });
    
    it('should be able to call init when paused', async function () {
      expect(await this.dripper.paused()).to.be.false;
      await this.dripper.pause({ from: governorAddress });
      expect(await this.dripper.paused()).to.be.true;

      const tribalChiefStartingBalance = await this.tribe.balanceOf(this.tribalChief.address);
      await this.dripper.init();
      const tribalChiefEndingBalance = await this.tribe.balanceOf(this.tribalChief.address);

      expect(await this.dripper.isTimeEnded()).to.be.false;
      expect(tribalChiefStartingBalance.add(dripAmount)).to.be.bignumber.equal(tribalChiefEndingBalance);
    });
  });

  describe('construction suite', () => {
    it('should not be able to construct with an invalid target address', async function () {
      await expectRevert(
        ERC20Dripper.new(
          this.core.address,
          ZERO_ADDRESS,
          dripFrequency,
          dripAmount,
          this.tribe.address
        ),
        'INV_ADDR'
      );
    });

    it('should not be able to construct with an invalid token address', async function () {
      await expectRevert(
        ERC20Dripper.new(
          this.core.address,
          this.tribe.address,
          dripFrequency,
          dripAmount,
          ZERO_ADDRESS,
        ),
        'INV_TOKEN_ADDR'
      );
    });

    it('should not be able to construct with an invalid frequency', async function () {
      await expectRevert(
        ERC20Dripper.new(
          this.core.address,
          this.tribalChief.address,
          0,
          dripAmount,
          this.tribe.address
        ),
        'Timed: zero duration'
      );
    });

    it('should not be able to construct with an invalid drip amount', async function () {
      await expectRevert(
        ERC20Dripper.new(
          this.core.address,
          this.tribalChief.address,
          dripFrequency,
          0,
          this.tribe.address
        ),
        'INV_DRIP'
      );
    });
  });

  describe('first suite', () => {
    it('should be able to call drip as any role while not paused', async function () {
      await time.increase(dripFrequency);
      await time.advanceBlock();

      expect(await this.dripper.isTimeEnded()).to.be.true;

      const tribalChiefStartingBalance = await this.tribe.balanceOf(this.tribalChief.address);
      await this.dripper.drip();
      const tribalChiefEndingBalance = await this.tribe.balanceOf(this.tribalChief.address);

      expect(await this.dripper.isTimeEnded()).to.be.false;
      expect(tribalChiefStartingBalance.add(dripAmount)).to.be.bignumber.equal(tribalChiefEndingBalance);
    });

    it('should be able to call drip after init when enough time has passed through multiple periods', async function () {
      // scope things so we can redeclare the same constant values
      {
        const tribalChiefStartingBalance = await this.tribe.balanceOf(this.tribalChief.address);
        await this.dripper.init();
        const tribalChiefEndingBalance = await this.tribe.balanceOf(this.tribalChief.address);

        expect(await this.dripper.isTimeEnded()).to.be.false;
        expect(tribalChiefStartingBalance.add(dripAmount)).to.be.bignumber.equal(tribalChiefEndingBalance);
      }
      for (let i = 0; i < 10; i++) {
        await time.increase(dripFrequency);
        await time.advanceBlock();

        expect(await this.dripper.isTimeEnded()).to.be.true;

        const tribalChiefStartingBalance = await this.tribe.balanceOf(this.tribalChief.address);
        await this.dripper.drip();
        const tribalChiefEndingBalance = await this.tribe.balanceOf(this.tribalChief.address);

        expect(await this.dripper.isTimeEnded()).to.be.false;
        expect(tribalChiefStartingBalance.add(dripAmount)).to.be.bignumber.equal(tribalChiefEndingBalance);
      }
    });
  });
});
