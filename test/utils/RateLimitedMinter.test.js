const {
  BN,
  time,
  expectRevert,
  expect,
  expectApprox,
  getAddresses,
  getCore, 
} = require('../helpers');
    
const RateLimitedMinter = artifacts.require('MockRateLimitedMinter');
const Fei = artifacts.require('Fei');
  
describe('RateLimitedMinter', function () {
  let userAddress;
  let governorAddress;
  
  beforeEach(async function () {
    ({
      userAddress,
      governorAddress,
    } = await getAddresses());
      
    this.core = await getCore(true);
  
    this.fei = await Fei.at(await this.core.fei());

    this.rateLimitPerSecond = '1';
    this.bufferCap = '20000';
    this.rateLimitedMinter = await RateLimitedMinter.new(
      this.core.address, 
      this.rateLimitPerSecond, 
      this.bufferCap, 
      false
    );

    await this.core.grantMinter(this.rateLimitedMinter.address, {from: governorAddress});
  });
  
  describe('Mint', function() {
    describe('Full mint', function() {
      beforeEach(async function () {
        await this.rateLimitedMinter.mint(userAddress, this.bufferCap);
      });

      it('clears out buffer', async function() {
        expectApprox(await this.rateLimitedMinter.buffer(), '0');
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.bufferCap);
      });

      it('second mint reverts', async function() {
        await expectRevert(this.rateLimitedMinter.mint(userAddress, this.bufferCap), 'RateLimited: rate limit hit');
      });

      it('time increase refreshes buffer', async function() {
        await time.increase('1000');
        expectApprox(await this.rateLimitedMinter.buffer(), '1000');
      });
    });
    describe('Partial Mint', function() {
      beforeEach(async function () {
        this.mintAmount = '10000';
        await this.rateLimitedMinter.setDoPartialMint(true); // mock method
        await this.rateLimitedMinter.mint(userAddress, this.mintAmount);
      });
    
      it('partially clears out buffer', async function() {
        expectApprox(await this.rateLimitedMinter.buffer(), '10000');
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.mintAmount);
      });
    
      it('second mint is partial', async function() {
        await this.rateLimitedMinter.mint(userAddress, this.bufferCap);
        expectApprox(await this.fei.balanceOf(userAddress), this.bufferCap);
        expectApprox(await this.rateLimitedMinter.buffer(), '0');
      });
    
      it('time increase refreshes buffer', async function() {
        await time.increase('1000');
        expectApprox(await this.rateLimitedMinter.buffer(), '11000');
      });
    });
  });
  
  describe('Set Fei Limit Per Second', function() {
    it('governor succeeds', async function() {
      await this.rateLimitedMinter.setRateLimitPerSecond('10000', {from: governorAddress});
      expect(await this.rateLimitedMinter.rateLimitPerSecond()).to.be.bignumber.equal(new BN('10000'));
    });
  
    it('non-governor reverts', async function() {
      await expectRevert(this.rateLimitedMinter.setRateLimitPerSecond('10000', {from: userAddress}), 'CoreRef: Caller is not a governor');
    });
  
    it('too high fei rate reverts', async function() {
      await expectRevert(this.rateLimitedMinter.setRateLimitPerSecond(new BN('20000000000000000000000'), {from: governorAddress}), 'RateLimited: rateLimitPerSecond too high');
    });
  });

  describe('Set Minting Buffer Cap', function() {
    it('governor succeeds', async function() {
      await this.rateLimitedMinter.setbufferCap('10000', {from: governorAddress});
      expect(await this.rateLimitedMinter.bufferCap()).to.be.bignumber.equal(new BN('10000'));
      expect(await this.rateLimitedMinter.buffer()).to.be.bignumber.equal(new BN('10000'));
    });
  
    it('non-governor reverts', async function() {
      await expectRevert(this.rateLimitedMinter.setbufferCap('10000', {from: userAddress}), 'CoreRef: Caller is not a governor');
    });
  });
});
