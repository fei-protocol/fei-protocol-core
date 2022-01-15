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
  CurvePCVDepositPlainPool,
  CurvePCVDepositPlainPool__factory
} from '@custom-types/contracts';

chai.config.includeStack = true;

describe('CurvePCVDepositPlainPool', function () {
  let core: Core;
  let fei: Fei;
  let stable1: MockERC20;
  let stable2: MockERC20;
  let curvePool: MockCurve3pool;
  let deposit: CurvePCVDepositPlainPool;

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
    curvePool = await new MockCurve3pool__factory(await getImpersonatedSigner(userAddress)).deploy(
      stable1.address,
      fei.address,
      stable2.address
    );
    deposit = await new CurvePCVDepositPlainPool__factory(await getImpersonatedSigner(userAddress)).deploy(
      core.address,
      curvePool.address,
      '50' // 0.5% slippage
    );

    // init the curve pool to be non empty
    curvePool.mint(userAddress, '10000');
    stable1.mint(curvePool.address, '3333');
    fei.connect(await getImpersonatedSigner(minterAddress)).mint(curvePool.address, '3334');
    stable2.mint(curvePool.address, '3333');
  });

  it('init', async function () {
    expect(await deposit.maxSlippageBasisPoints()).to.be.equal('50');
    expect(await deposit.curvePool()).to.be.equal(curvePool.address);
  });

  describe('balanceReportedIn()', function () {
    it('should report values in USD', async function () {
      expect(await deposit.balanceReportedIn()).to.be.equal('0x1111111111111111111111111111111111111111');
    });
  });

  describe('balance()', function () {
    it('should report the current instantaneous balance in USD', async function () {
      expect(await deposit.balance()).to.be.equal('0');
      // increment with more LP tokens
      await curvePool.transfer(deposit.address, '5000');
      expect(await deposit.balance()).to.be.equal('3333');
      await curvePool.transfer(deposit.address, '5000');
      expect(await deposit.balance()).to.be.equal('6666');
      // reduce if FEI share of the pool increases
      fei.connect(await getImpersonatedSigner(minterAddress)).mint(curvePool.address, '10000');
      expect(await deposit.balance()).to.be.equal('3333');
    });
  });

  describe('resistantBalanceAndFei()', function () {
    it('should report the resistant balance in USD and FEI', async function () {
      expect((await deposit.resistantBalanceAndFei())[0]).to.be.equal('0');
      expect((await deposit.resistantBalanceAndFei())[1]).to.be.equal('0');
      await curvePool.transfer(deposit.address, '10000');
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
      await stable1.mint(deposit.address, '5000');
      expect(await deposit.balance()).to.be.equal('0');
      await deposit.deposit();
      expect(await deposit.balance()).to.be.equal('3889');
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

    it('should send FEI to target', async function () {
      stable1.mint(deposit.address, '3333333');
      fei.connect(await getImpersonatedSigner(minterAddress)).mint(deposit.address, '333334');
      stable2.mint(deposit.address, '3333333');
      await deposit.deposit();
      await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, '50000');
      expect(await fei.balanceOf(userAddress)).to.be.equal('50000');
    });
  });

  describe('withdrawOneCoin()', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(
        deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdrawOneCoin('0', userAddress, '1000')
      ).to.be.revertedWith('Pausable: paused');
    });

    it('reverts if not PCVController', async function () {
      await expect(
        deposit.connect(await getImpersonatedSigner(userAddress)).withdrawOneCoin('0', userAddress, '1000')
      ).to.be.revertedWith('CoreRef: Caller is not a PCV controller');
    });

    it('should send Tokens to target', async function () {
      stable1.mint(deposit.address, '3333333');
      fei.connect(await getImpersonatedSigner(minterAddress)).mint(deposit.address, '333334');
      stable2.mint(deposit.address, '3333333');
      await deposit.deposit();
      await deposit
        .connect(await getImpersonatedSigner(pcvControllerAddress))
        .withdrawOneCoin('0', userAddress, '50000');
      expect(await stable1.balanceOf(userAddress)).to.be.equal('50000');
    });
  });

  describe('exitPool()', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).exitPool()).to.be.revertedWith(
        'Pausable: paused'
      );
    });

    it('reverts if not PCVController', async function () {
      await expect(deposit.connect(await getImpersonatedSigner(userAddress)).exitPool()).to.be.revertedWith(
        'CoreRef: Caller is not a PCV controller'
      );
    });

    it('should unpair all underlying tokens', async function () {
      await curvePool.transfer(deposit.address, '10000');
      await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).exitPool();
      expect(await stable1.balanceOf(deposit.address)).to.be.equal('3333');
      expect(await fei.balanceOf(deposit.address)).to.be.equal('3333'); // rounding error
      expect(await stable2.balanceOf(deposit.address)).to.be.equal('3333');
    });
  });
});
