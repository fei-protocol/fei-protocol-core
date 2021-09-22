import { expectRevert, balance, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai'
import hre, { ethers, artifacts } from 'hardhat'
      
const AavePCVDeposit = artifacts.readArtifactSync('AavePCVDeposit');
const MockLendingPool = artifacts.readArtifactSync('MockLendingPool');
const MockERC20 = artifacts.readArtifactSync('MockERC20');

describe('AavePCVDeposit', function () {
  let userAddress: string
  let pcvControllerAddress: string
  let governorAddress: string
      
  beforeEach(async function () {
    ({
      userAddress,
      pcvControllerAddress,
      governorAddress
    } = await getAddresses());
    
    this.core = await getCore();
  
    this.lendingPool = await MockLendingPool.new();
    this.token = await MockERC20.new();
    this.aToken = await MockERC20.at(await this.lendingPool.aToken());   

    this.aavePCVDeposit = await AavePCVDeposit.new(
      this.core.address, 
      this.lendingPool.address, 
      this.token.address,
      this.aToken.address,
      this.token.address // filling in dummy address for incentives controller
    );
  
    this.depositAmount = toBN('1000000000000000000');
  });
      
  describe('Deposit', function() {
    describe('Paused', function() {
      it('reverts', async function() {
        await this.aavePCVDeposit.pause({from: governorAddress});
        await expectRevert(this.aavePCVDeposit.deposit(), 'Pausable: paused');
      });
    });
    
    describe('Not Paused', function() {
      beforeEach(async function() {
        await this.token.mint(this.aavePCVDeposit.address, this.depositAmount);
      });
  
      it('succeeds', async function() {
        expect(await this.aavePCVDeposit.balance()).to.be.equal(toBN('0'));
        await this.aavePCVDeposit.deposit();
        // Balance should increment with the new deposited aTokens underlying
        expect(await this.aavePCVDeposit.balance()).to.be.equal(this.depositAmount);
        
        // Held balance should be 0, now invested into Aave
        expect(await this.token.balanceOf(this.aavePCVDeposit.address)).to.be.equal(toBN('0'));
      });
    });
  });
  
  describe('Withdraw', function() {
    beforeEach(async function() {
      await this.token.mint(this.aavePCVDeposit.address, this.depositAmount);
      await this.aavePCVDeposit.deposit();
    });

    describe('Not PCVController', function() {
      it('reverts', async function() {
        await expectRevert(this.aavePCVDeposit.withdraw(userAddress, this.depositAmount, {from: userAddress}), 'CoreRef: Caller is not a PCV controller');
      });
    });
  
    it('succeeds', async function() {
      const userBalanceBefore = await this.token.balanceOf(userAddress);
        
      // withdrawing should take balance back to 0
      expect(await this.aavePCVDeposit.balance()).to.be.equal(this.depositAmount);
      await this.aavePCVDeposit.withdraw(userAddress, this.depositAmount, {from: pcvControllerAddress});
      expect(await this.aavePCVDeposit.balance()).to.be.equal(toBN('0'));
        
      const userBalanceAfter = await this.token.balanceOf(userAddress);
  
      expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(this.depositAmount);
    });
  });
  
  describe('WithdrawERC20', function() {
    describe('Not PCVController', function() {
      it('reverts', async function() {
        await expectRevert(this.aavePCVDeposit.withdrawERC20(this.aToken.address, userAddress, this.depositAmount, {from: userAddress}), 'CoreRef: Caller is not a PCV controller');
      });
    });
  
    describe('From PCVController', function() {
      beforeEach(async function() {
        await this.token.mint(this.aavePCVDeposit.address, this.depositAmount);
        await this.aavePCVDeposit.deposit();
      });
  
      it('succeeds', async function() {
        expect(await this.aavePCVDeposit.balance()).to.be.equal(this.depositAmount);
        await this.aavePCVDeposit.withdrawERC20(this.aToken.address, userAddress, this.depositAmount.div(toBN('2')), {from: pcvControllerAddress});        

        // balance should also get cut in half
        expect(await this.aavePCVDeposit.balance()).to.be.equal(this.depositAmount.div(toBN('2')));
  
        expect(await this.aToken.balanceOf(userAddress)).to.be.equal(this.depositAmount.div(toBN('2')));
      });
    });
  });
});
