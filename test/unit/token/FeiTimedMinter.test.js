const {
  ZERO_ADDRESS,
  BN,
  expectRevert,
  expect,
  time,
  getAddresses,
  getCore,
  expectApprox,
} = require('../../helpers');
    
const FeiTimedMinter = artifacts.readArtifactSync('FeiTimedMinter');
const Fei = artifacts.readArtifactSync('Fei');
  
describe('FeiTimedMinter', function () {
  let userAddress;
  let secondUserAddress;
  let governorAddress;
  
  beforeEach(async function () {
    ({
      userAddress,
      secondUserAddress,
      governorAddress,
    } = await getAddresses());
      
    this.core = await getCore();
  
    this.fei = await Fei.at(await this.core.fei());
  
    this.incentive = '100';
    this.frequency = '3600';
    this.intialMintAmount = '10000';
    this.feiMinter = await FeiTimedMinter.new(
      this.core.address,
      userAddress, 
      this.incentive, 
      this.frequency, 
      this.intialMintAmount
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
      expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.intialMintAmount);
        
      // incentive for caller
      expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.incentive);
    });
  });
  
  describe('Set Target', function() {
    it('governor succeeds', async function() {
      await this.feiMinter.setTarget(secondUserAddress, {from: governorAddress});
      expect(await this.feiMinter.target()).to.be.equal(secondUserAddress);
    });
  
    it('non-governor reverts', async function() {
      await expectRevert(this.feiMinter.setTarget(secondUserAddress, {from: userAddress}), 'CoreRef: Caller is not a governor');
    });
  
    it('zero address reverts', async function() {
      await expectRevert(this.feiMinter.setTarget(ZERO_ADDRESS, {from: governorAddress}), 'FeiTimedMinter: zero address');
    });
  });

  describe('Set Mint Amount', function() {
    it('governor succeeds', async function() {
      await this.feiMinter.setMintAmount('500', {from: governorAddress});
      expect(await this.feiMinter.mintAmount()).to.be.bignumber.equal('500');
    });
  
    it('non-governor reverts', async function() {
      await expectRevert(this.feiMinter.setMintAmount('500', {from: userAddress}), 'CoreRef: Caller is not a governor');
    });
  });

  describe('Set Frequency', function() {
    it('governor succeeds', async function() {
      await this.feiMinter.setFrequency('5000', {from: governorAddress});
      expect(await this.feiMinter.duration()).to.be.bignumber.equal('5000');
    });
  
    it('non-governor reverts', async function() {
      await expectRevert(this.feiMinter.setFrequency('5000', {from: userAddress}), 'CoreRef: Caller is not a governor');
    });
  
    it('below min reverts', async function() {
      await expectRevert(this.feiMinter.setFrequency('500', {from: governorAddress}), 'FeiTimedMinter: frequency low');
    });

    it('above max reverts', async function() {
      await expectRevert(this.feiMinter.setFrequency('5000000', {from: governorAddress}), 'FeiTimedMinter: frequency high');
    });
  });
});
