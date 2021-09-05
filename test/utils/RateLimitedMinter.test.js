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

    this.feiLimitPerSecond = '1';
    this.mintingBufferCap = '20000';
    this.rateLimitedMinter = await RateLimitedMinter.new(
      this.core.address, 
      this.feiLimitPerSecond, 
      this.mintingBufferCap, 
      false
    );

    await this.core.grantMinter(this.rateLimitedMinter.address, {from: governorAddress});
  });
  
  describe('Mint', function() {
    describe('Full mint', function() {
      beforeEach(async function () {
        await this.rateLimitedMinter.mint(userAddress, this.mintingBufferCap);
      });

      it('clears out buffer', async function() {
        expectApprox(await this.rateLimitedMinter.mintingBuffer(), '0');
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.mintingBufferCap);
      });

      it('second mint reverts', async function() {
        await expectRevert(this.rateLimitedMinter.mint(userAddress, this.mintingBufferCap), 'RateLimitedMinter: rate limit hit');
      });

      it('time increase refreshes buffer', async function() {
        await time.increase('1000');
        expectApprox(await this.rateLimitedMinter.mintingBuffer(), '1000');
      });
    });
    describe('Partial Mint', function() {
      beforeEach(async function () {
        this.mintAmount = '10000';
        await this.rateLimitedMinter.setDoPartialMint(true); // mock method
        await this.rateLimitedMinter.mint(userAddress, this.mintAmount);
      });
    
      it('partially clears out buffer', async function() {
        expectApprox(await this.rateLimitedMinter.mintingBuffer(), '10000');
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.mintAmount);
      });
    
      it('second mint is partial', async function() {
        await this.rateLimitedMinter.mint(userAddress, this.mintingBufferCap);
        expectApprox(await this.fei.balanceOf(userAddress), this.mintingBufferCap);
        expectApprox(await this.rateLimitedMinter.mintingBuffer(), '0');
      });
    
      it('time increase refreshes buffer', async function() {
        await time.increase('1000');
        expectApprox(await this.rateLimitedMinter.mintingBuffer(), '11000');
      });
    });
  });
  
  describe('Set Fei Limit Per Second', function() {
    it('governor succeeds', async function() {
      await this.rateLimitedMinter.setFeiLimitPerSecond('10000', {from: governorAddress});
      expect(await this.rateLimitedMinter.feiLimitPerSecond()).to.be.bignumber.equal(new BN('10000'));
    });
  
    it('non-governor reverts', async function() {
      await expectRevert(this.rateLimitedMinter.setFeiLimitPerSecond('10000', {from: userAddress}), 'CoreRef: Caller is not a governor');
    });
  
    it('too high fei rate reverts', async function() {
      await expectRevert(this.rateLimitedMinter.setFeiLimitPerSecond(new BN('20000000000000000000000'), {from: governorAddress}), 'RateLimitedMinter: feiLimitPerSecond too high');
    });
  });

  describe('Set Minting Buffer Cap', function() {
    it('governor succeeds', async function() {
      await this.rateLimitedMinter.setMintingBufferCap('10000', {from: governorAddress});
      expect(await this.rateLimitedMinter.mintingBufferCap()).to.be.bignumber.equal(new BN('10000'));
      expect(await this.rateLimitedMinter.mintingBuffer()).to.be.bignumber.equal(new BN('10000'));
    });
  
    it('non-governor reverts', async function() {
      await expectRevert(this.rateLimitedMinter.setMintingBufferCap('10000', {from: userAddress}), 'CoreRef: Caller is not a governor');
    });
  });
});
