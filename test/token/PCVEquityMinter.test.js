const {
  ZERO_ADDRESS,
  BN,
  expectRevert,
  expect,
  time,
  getAddresses,
  getCore,
  expectApprox,
} = require('../helpers');
      
const PCVEquityMinter = artifacts.require('PCVEquityMinter');
const PCVSwapper = artifacts.require('MockPCVSwapper');
const MockCollateralizationOracle = artifacts.require('MockCollateralizationOracle');
const Fei = artifacts.require('Fei');
    
describe('PCVEquityMinter', function () {
  let userAddress;
  let secondUserAddress;
  let governorAddress;
    
  beforeEach(async function () {
    ({
      userAddress,
      secondUserAddress,
      governorAddress,
    } = await getAddresses());
        
    this.core = await getCore(true);
    this.collateralizationOracle = await MockCollateralizationOracle.new(this.core.address, '1');

    this.fei = await Fei.at(await this.core.fei());
    
    this.swapper = await PCVSwapper.new();

    this.incentive = '100';
    this.frequency = '3600'; // 1 hour
    this.intialMintAmount = '10000';
    this.aprBasisPoints = '200'; // 2%
    this.feiMinter = await PCVEquityMinter.new(
      this.core.address,
      this.swapper.address, 
      this.incentive, 
      this.frequency, 
      this.collateralizationOracle.address,
      this.aprBasisPoints
    );
    
    await this.core.grantMinter(this.feiMinter.address, {from: governorAddress}); 
  });
    
  describe('Mint', function() {
    it('paued reverts', async function() {
      await this.feiMinter.pause({from: governorAddress});
      await expectRevert(this.feiMinter.mint({from: userAddress}), 'Pausable: paused');
    });
  
    it('before time reverts', async function() {
      await expectRevert(this.feiMinter.mint({from: userAddress}), 'Timed: time not ended');
    });
  
    describe('after time', function() {
      beforeEach(async function() {
        await time.increase(this.frequency);
        await time.increase(this.frequency);
      });

      it('below rate limit succeeds', async function () {
        await this.feiMinter.mint({from: secondUserAddress});
    
        // timer reset
        expectApprox(await this.feiMinter.remainingTime(), this.frequency);
          
        // mint sent
        const expected = (4e20 * 0.02) / (24 * 365); // This is equity * APR / durations / year
        expectApprox(await this.fei.balanceOf(this.swapper.address), expected);
          
        // incentive for caller
        expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.incentive);
        expect(await this.swapper.swapped()).to.be.true;
      });

      it('above rate limit does partial mint', async function () {
        // set PCV equity to be massive
        await this.collateralizationOracle.set('0', '10000000000000000000000000000000000');
        
        // The buffer is the expected value with excess equity
        const expected = await this.feiMinter.buffer();

        await this.feiMinter.mint({from: secondUserAddress});
    
        // timer reset
        expectApprox(await this.feiMinter.remainingTime(), this.frequency);
          
        // mint sent
        expectApprox(await this.fei.balanceOf(this.swapper.address), expected);
          
        // incentive for caller
        expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.incentive);
        expect(await this.swapper.swapped()).to.be.true;
      });
    });
  });
    
  describe('Set Collateralization Oracle', function() {
    it('governor succeeds', async function() {
      await this.feiMinter.setCollateralizationOracle(secondUserAddress, {from: governorAddress});
      expect(await this.feiMinter.collateralizationOracle()).to.be.equal(secondUserAddress);
    });
    
    it('non-governor reverts', async function() {
      await expectRevert(this.feiMinter.setCollateralizationOracle(secondUserAddress, {from: userAddress}), 'CoreRef: Caller is not a governor');
    });
    
    it('zero address reverts', async function() {
      await expectRevert(this.feiMinter.setCollateralizationOracle(ZERO_ADDRESS, {from: governorAddress}), 'PCVEquityMinter: zero address');
    });
  });
  
  describe('Set APR Basis Points', function() {
    it('governor succeeds', async function() {
      await this.feiMinter.setAPRBasisPoints('1000', {from: governorAddress});
      expect(await this.feiMinter.aprBasisPoints()).to.be.bignumber.equal('1000');
    });
    
    it('non-governor reverts', async function() {
      await expectRevert(this.feiMinter.setAPRBasisPoints('1000', {from: userAddress}), 'CoreRef: Caller is not a governor');
    });
    
    it('zero reverts', async function() {
      await expectRevert(this.feiMinter.setAPRBasisPoints('0', {from: governorAddress}), 'PCVEquityMinter: zero APR');
    });
  
    it('above max reverts', async function() {
      await expectRevert(this.feiMinter.setAPRBasisPoints('5000', {from: governorAddress}), 'PCVEquityMinter: APR above max');
    });
  });
});
