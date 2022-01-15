import { getImpersonatedSigner, getAddresses, getCore } from '@test/helpers';
import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  Core,
  Fei,
  MockERC20,
  MockERC20__factory,
  MockCurve3pool,
  MockCurve3pool__factory,
  MockConvexBooster,
  MockConvexBooster__factory,
  MockConvexBaseRewardPool,
  MockConvexBaseRewardPool__factory,
  ConvexPCVDeposit,
  ConvexPCVDeposit__factory
} from '@custom-types/contracts';

chai.config.includeStack = true;

describe('ConvexPCVDeposit', function () {
  let core: Core;
  let fei: Fei;
  let stable1: MockERC20;
  let stable2: MockERC20;
  let cvx: MockERC20;
  let curvePool: MockCurve3pool;
  let convexBooster: MockConvexBooster;
  let convexReward: MockConvexBaseRewardPool;
  let deposit: ConvexPCVDeposit;

  let userAddress: string;
  let pcvControllerAddress: string;
  let minterAddress: string;
  let governorAddress: string;

  before(async () => {
    const addresses = await getAddresses();
    userAddress = addresses.userAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;
    minterAddress = addresses.minterAddress;
    governorAddress = addresses.governorAddress;
  });

  beforeEach(async function () {
    core = await getCore();
    fei = await ethers.getContractAt('Fei', await core.fei());
    stable1 = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
    stable2 = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
    cvx = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
    curvePool = await new MockCurve3pool__factory(await getImpersonatedSigner(userAddress)).deploy(
      stable1.address,
      fei.address,
      stable2.address
    );
    convexReward = await new MockConvexBaseRewardPool__factory(await getImpersonatedSigner(userAddress)).deploy(
      cvx.address,
      curvePool.address
    );
    convexBooster = await new MockConvexBooster__factory(await getImpersonatedSigner(userAddress)).deploy(
      convexReward.address,
      curvePool.address
    );
    deposit = await new ConvexPCVDeposit__factory(await getImpersonatedSigner(userAddress)).deploy(
      core.address,
      curvePool.address,
      convexBooster.address,
      convexReward.address
    );

    // init the curve pool to be non empty
    curvePool.mint(userAddress, '10000');
    stable1.mint(curvePool.address, '3333');
    fei.connect(await getImpersonatedSigner(minterAddress)).mint(curvePool.address, '3334');
    stable2.mint(curvePool.address, '3333');
  });

  it('init', async function () {
    expect(await deposit.curvePool()).to.be.equal(curvePool.address);
    expect(await deposit.convexBooster()).to.be.equal(convexBooster.address);
    expect(await deposit.convexRewards()).to.be.equal(convexReward.address);
  });

  describe('balanceReportedIn()', function () {
    it('should report values in USD', async function () {
      expect(await deposit.balanceReportedIn()).to.be.equal('0x1111111111111111111111111111111111111111');
    });
  });

  describe('balance()', function () {
    it('should report the current instantaneous balance in USD', async function () {
      expect(await deposit.balance()).to.be.equal('0');
      await curvePool.transfer(deposit.address, '10000');
      await deposit.deposit();
      expect(await deposit.balance()).to.be.equal('6666');
      fei.connect(await getImpersonatedSigner(minterAddress)).mint(curvePool.address, '10000');
      expect(await deposit.balance()).to.be.equal('3333');
    });
  });

  describe('resistantBalanceAndFei()', function () {
    it('should report the resistant balance in USD and FEI', async function () {
      expect((await deposit.resistantBalanceAndFei())[0]).to.be.equal('0');
      expect((await deposit.resistantBalanceAndFei())[1]).to.be.equal('0');
      await curvePool.transfer(deposit.address, '10000');
      await deposit.deposit();
      expect((await deposit.resistantBalanceAndFei())[0]).to.be.equal('6667');
      expect((await deposit.resistantBalanceAndFei())[1]).to.be.equal('3333');
      fei.connect(await getImpersonatedSigner(minterAddress)).mint(deposit.address, '10000');
      // no change, because the pool imbalance does not matter here
      expect((await deposit.resistantBalanceAndFei())[0]).to.be.equal('6667');
      expect((await deposit.resistantBalanceAndFei())[1]).to.be.equal('3333');
    });
  });

  describe('deposit()', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(deposit.deposit()).to.be.revertedWith('Pausable: paused');
    });

    it('succeeds if not paused', async function () {
      expect(await curvePool.balanceOf(convexReward.address)).to.be.equal('0');
      await curvePool.transfer(deposit.address, '10000');
      await deposit.deposit();
      expect(await curvePool.balanceOf(convexReward.address)).to.be.equal('10000');
    });
  });

  describe('withdraw()', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(
        deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, '1000')
      ).to.be.revertedWith('Pausable: paused');
    });

    it('reverts if not PCVController', async function () {
      await expect(
        deposit.connect(await getImpersonatedSigner(userAddress)).withdraw(userAddress, '1000')
      ).to.be.revertedWith('CoreRef: Caller is not a PCV controller');
    });

    it('should succeed if not paused', async function () {
      await curvePool.transfer(deposit.address, '10000');
      await deposit.deposit();
      expect(await curvePool.balanceOf(convexReward.address)).to.be.equal('10000');
      expect(await curvePool.balanceOf(deposit.address)).to.be.equal('0');
      await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(deposit.address, '5000');
      expect(await curvePool.balanceOf(convexReward.address)).to.be.equal('5000');
      expect(await curvePool.balanceOf(deposit.address)).to.be.equal('5000');
      await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, '5000');
      expect(await curvePool.balanceOf(convexReward.address)).to.be.equal('0');
      expect(await curvePool.balanceOf(deposit.address)).to.be.equal('5000');
      expect(await curvePool.balanceOf(userAddress)).to.be.equal('5000');
    });
  });

  describe('claimRewards()', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(deposit.claimRewards()).to.be.revertedWith('Pausable: paused');
    });

    it('should claim rewards & leave them on the deposit', async function () {
      await convexReward.mockSetRewardAmountPerClaim('12345');

      const userBalanceBefore = await cvx.balanceOf(deposit.address);
      await deposit.claimRewards();
      const userBalanceAfter = await cvx.balanceOf(deposit.address);

      expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal('12345');
    });
  });
});
