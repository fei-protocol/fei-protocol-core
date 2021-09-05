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
const MockCollateralizationOracle = artifacts.require('MockCollateralizationOracle');
const Fei = artifacts.require('Fei');
    
describe.only('PCVEquityMinter', function () {
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
    this.collateralizationOracle = await MockCollateralizationOracle.new('1');

    this.fei = await Fei.at(await this.core.fei());
    
    this.incentive = '100';
    this.frequency = '3600'; // 1 hour
    this.intialMintAmount = '10000';
    this.aprBasisPoints = '200'; // 2%
    this.feiMinter = await PCVEquityMinter.new(
      this.core.address,
      userAddress, 
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
  
    it('after time succeeds', async function () {
      await time.increase(this.frequency);
      await time.increase(this.frequency);
      await this.feiMinter.mint({from: secondUserAddress});
  
      // timer reset
      expectApprox(await this.feiMinter.remainingTime(), this.frequency);
        
      // mint sent
      const expected = (4e20 * 0.02) / (24 * 365); // This is equity * APR / durations / year
      expectApprox(await this.fei.balanceOf(userAddress), expected);
        
      // incentive for caller
      expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.incentive);
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
