import { MAX_UINT256, expectRevert, getAddresses, getCore } from '../../helpers';
import hre, { ethers, artifacts } from 'hardhat'
import { expect } from 'chai'

const toBN = ethers.BigNumber.from

const TribeReserveStabilizer = artifacts.readArtifactSync('TribeReserveStabilizer');
const Fei = artifacts.readArtifactSync('Fei');
const Tribe = artifacts.readArtifactSync('Tribe');
const MockOracle = artifacts.readArtifactSync('MockOracle');
const MockCollateralizationOracle = artifacts.readArtifactSync('MockCollateralizationOracle');
const MockPCVDeposit = artifacts.readArtifactSync('MockEthUniswapPCVDeposit');

describe('TribeReserveStabilizer', function () {
  let userAddress;
  let governorAddress;
  let minterAddress;
  let pcvControllerAddress;

  beforeEach(async function () {
    ({
      userAddress,
      governorAddress,
      minterAddress,
      pcvControllerAddress,
    } = await getAddresses());
    this.core = await getCore();
  
    this.fei = await Fei.at(await this.core.fei());
    this.tribe = await Tribe.at(await this.core.tribe());
    this.oracle = await MockOracle.new(400); // 400:1 oracle price
    this.collateralizationOracle = await MockCollateralizationOracle.new(this.core.address, 1);
    this.pcvDeposit = await MockPCVDeposit.new(userAddress);

    this.reserveStabilizer = await TribeReserveStabilizer.new(
      this.core.address, 
      this.oracle.address, 
      this.oracle.address, 
      '9000', // $.90 exchange rate
      this.collateralizationOracle.address, 
      '10000', // 100% CR threshold
      '10000000', // max rate limit per second
      '10000000', // rate limit per second
      '10000000000' // buffer cap
    );

    await this.core.grantBurner(this.reserveStabilizer.address, {from: governorAddress});

    await this.tribe.setMinter(this.reserveStabilizer.address, {from: governorAddress});

    await this.fei.mint(userAddress, 40000000, {from: minterAddress});  
  });

  describe('Exchange', function() {
    describe('Enough FEI', function() {
      it('exchanges for appropriate amount of token', async function() {
        const userBalanceBefore = await this.tribe.balanceOf(userAddress);
        await this.reserveStabilizer.exchangeFei(40000000, {from: userAddress});
        const userBalanceAfter = await this.tribe.balanceOf(userAddress);

        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.bignumber.equal(toBN('90000'));

        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(toBN('0'));
        expect(await this.reserveStabilizer.balance()).to.be.bignumber.equal(toBN('0'));
      });
    });

    describe('Double Oracle price', function() {
      it('exchanges for appropriate amount of token', async function() {
        await this.oracle.setExchangeRate('800');

        const userBalanceBefore = await this.tribe.balanceOf(userAddress);
        await this.reserveStabilizer.exchangeFei(40000000, {from: userAddress});
        const userBalanceAfter = await this.tribe.balanceOf(userAddress);

        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.bignumber.equal(toBN('45000'));

        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(toBN('0'));
        expect(await this.reserveStabilizer.balance()).to.be.bignumber.equal(toBN('0'));
      });
    });

    describe('No Held TRIBE', function() {
      it('mints all TRIBE', async function() {
        expect(await this.tribe.balanceOf(this.reserveStabilizer.address)).to.be.bignumber.equal(toBN('0'));
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('0'));
        await this.reserveStabilizer.exchangeFei('4444445', {from: userAddress});
        expect(await this.tribe.balanceOf(this.reserveStabilizer.address)).to.be.bignumber.equal(toBN('0'));
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('10000'));
      });
    });

    describe('Some Held TRIBE', function() {
      beforeEach(async function() {
        this.mintAmount = toBN('10000');
        await this.reserveStabilizer.mint(this.reserveStabilizer.address, this.mintAmount, {from: governorAddress});
        expect(await this.tribe.balanceOf(this.reserveStabilizer.address)).to.be.bignumber.equal(this.mintAmount);
      });

      it('mints some TRIBE', async function() {
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('0'));
        await this.reserveStabilizer.exchangeFei('8888889', {from: userAddress});
        expect(await this.tribe.balanceOf(this.reserveStabilizer.address)).to.be.bignumber.equal('0');
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('20000'));
      });
    });

    describe('Exceed Buffer', function() {
      beforeEach(async function() {
        await this.fei.mint(userAddress, '100000000000000000000000', {from: minterAddress});  
        this.buffer = await this.reserveStabilizer.buffer();
        this.feiAmount = this.buffer.mul(toBN('400')); // mul by oracle price
        await this.reserveStabilizer.exchangeFei(this.feiAmount, {from: userAddress});
      });

      it('reverts', async function() {
        await expectRevert(this.reserveStabilizer.exchangeFei(this.feiAmount, {from: userAddress}), 'RateLimited: rate limit hit');
      });
    });

    describe('FEI above threshold', function() {
      it('reverts', async function() {
        await this.reserveStabilizer.setCollateralizationThreshold('9900', {from: governorAddress});
        await expectRevert(this.reserveStabilizer.exchangeFei(40000000, {from: userAddress}), 'TribeReserveStabilizer: Collateralization ratio above threshold');
      });
    });

    describe('Paused', function() {
      it('reverts', async function() {
        await this.reserveStabilizer.pause({from: governorAddress});
        await expectRevert(this.reserveStabilizer.exchangeFei(toBN('400000'), {from: userAddress}), 'Pausable: paused');
      });
    });
  });
  
  describe('isCollateralizationBelowThreshold', function() {
    it('above', async function() {
      await this.reserveStabilizer.setCollateralizationThreshold('9900', {from: governorAddress});
      expect(await this.reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(false);
    });

    it('at', async function() {
      expect(await this.reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(true);
    });

    it('below', async function() {
      await this.reserveStabilizer.setCollateralizationThreshold('10000', {from: governorAddress});
      expect(await this.reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(true);
    });

    it('invalid oracle', async function() {
      await this.collateralizationOracle.setValid(false);
      expect(await this.reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(false);
    });
  });

  describe('Withdraw', function() {
    it('reverts', async function() {
      await expectRevert(this.reserveStabilizer.withdraw(userAddress, '1000000000', {from: pcvControllerAddress}), 'TribeReserveStabilizer: can\'t withdraw');
    });
  });

  describe('WithdrawERC20', function() {
    it('tribe token reverts', async function() {
      await expectRevert(this.reserveStabilizer.withdrawERC20(this.tribe.address, userAddress, '1000000000', {from: pcvControllerAddress}), 'TribeReserveStabilizer: can\'t withdraw');
    });

    it('non-tribe token succeeds', async function() {
      await this.fei.mint(this.reserveStabilizer.address, 1000, {from: minterAddress});  

      await this.reserveStabilizer.withdrawERC20(this.fei.address, userAddress, '1000', {from: pcvControllerAddress});
      expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal('40001000');
    });

    it('non-pcv controller reverts', async function() {
      await this.fei.mint(this.reserveStabilizer.address, 1000, {from: minterAddress});  

      await expectRevert(this.reserveStabilizer.withdrawERC20(this.fei.address, userAddress, '1000', {from: userAddress}), 'CoreRef: Caller is not a PCV controller');
    });
  });

  describe('Not Enough FEI', function() {
    it('reverts', async function() {
      await expectRevert(this.reserveStabilizer.exchangeFei(50000000, {from: userAddress}), 'ERC20: burn amount exceeds balance');
    });
  });

  describe('Paused', function() {
    it('reverts', async function() {
      await this.reserveStabilizer.pause({from: governorAddress});
      await expectRevert(this.reserveStabilizer.exchangeFei(toBN('400000'), {from: userAddress}), 'Pausable: paused');
    });
  });

  describe('Mint', function() {
    describe('Access', function() {
      it('governor succeeds', async function() {
        await this.reserveStabilizer.mint(userAddress, '10000', {from: governorAddress});
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('10000'));
      });
  
      it('non-governor reverts', async function() {
        await expectRevert(this.reserveStabilizer.mint(userAddress, '10000', {from: userAddress}), 'CoreRef: Caller is not a governor');
      });
    });
    describe('No Held TRIBE', function() {
      it('mints all TRIBE', async function() {
        expect(await this.tribe.balanceOf(this.reserveStabilizer.address)).to.be.bignumber.equal(toBN('0'));
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('0'));
        await this.reserveStabilizer.mint(userAddress, '10000', {from: governorAddress});
        expect(await this.tribe.balanceOf(this.reserveStabilizer.address)).to.be.bignumber.equal(toBN('0'));
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('10000'));
      });
    });

    describe('Some Held TRIBE', function() {
      beforeEach(async function() {
        this.mintAmount = toBN('10000');
        await this.reserveStabilizer.mint(this.reserveStabilizer.address, this.mintAmount, {from: governorAddress});
        expect(await this.tribe.balanceOf(this.reserveStabilizer.address)).to.be.bignumber.equal(this.mintAmount);
      });

      it('mints all TRIBE', async function() {
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('0'));
        await this.reserveStabilizer.mint(userAddress, '20000', {from: governorAddress});
        expect(await this.tribe.balanceOf(this.reserveStabilizer.address)).to.be.bignumber.equal(this.mintAmount);
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(toBN('20000'));
      });
    });
  });

  describe('Set Minter', function() {
    it('governor succeeds', async function() {
      await this.reserveStabilizer.setMinter(userAddress, {from: governorAddress});
      expect(await this.tribe.minter()).to.be.equal(userAddress);
    });

    it('non-governor reverts', async function() {
      await expectRevert(this.reserveStabilizer.setMinter(userAddress, {from: userAddress}), 'CoreRef: Caller is not a governor');
    });
  });

  describe('Set USD per FEI', function() {
    it('governor succeeds', async function() {
      await this.reserveStabilizer.setUsdPerFeiRate('10000', {from: governorAddress});
      expect(await this.reserveStabilizer.usdPerFeiBasisPoints()).to.be.bignumber.equal(toBN('10000'));
    });

    it('non-governor reverts', async function() {
      await expectRevert(this.reserveStabilizer.setUsdPerFeiRate('10000', {from: userAddress}), 'CoreRef: Caller is not a governor');
    });

    it('too high usd per fei reverts', async function() {
      await expectRevert(this.reserveStabilizer.setUsdPerFeiRate('10001', {from: governorAddress}), 'ReserveStabilizer: Exceeds bp granularity');
    });
  });
});
