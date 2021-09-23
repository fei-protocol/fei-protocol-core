import { expectEvent, expectRevert, time, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai'
import hre, { ethers, artifacts } from 'hardhat'
import { Signer } from 'ethers'

const StableSwapOperatorV1 = artifacts.readArtifactSync('StableSwapOperatorV1');
const MockCurve3pool = artifacts.readArtifactSync('MockCurve3pool');
const MockCurveMetapool = artifacts.readArtifactSync('MockCurveMetapool');
const Fei = artifacts.readArtifactSync('Fei');
const MockERC20 = artifacts.readArtifactSync('MockERC20');
const e18 = '000000000000000000';

const toBN = ethers.BigNumber.from

describe('StableSwapOperatorV1', function () {
  let userAddress: string
  let governorAddress: string
  let minterAddress: string
  let burnerAddress: string
  let pcvControllerAddress: string

  let impersonatedSigners: { [key: string]: Signer } = { }

  before(async() => {
    const addresses = await getAddresses()

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.pcvControllerAddress,
      addresses.minterAddress,
      addresses.burnerAddress,
      addresses.beneficiaryAddress1,
      addresses.beneficiaryAddress2
    ]

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address]
      })

      impersonatedSigners[address] = await ethers.getSigner(address)
    }
  });

  beforeEach(async function () {
    ({
      userAddress,
      governorAddress,
      minterAddress,
      burnerAddress,
      pcvControllerAddress
    } = await getAddresses());

    // create contracts
    this.core = await getCore();
    this.fei = await ethers.getContractAt('Fei', await this.core.fei());
    this.dai = await (await ethers.getContractFactory('MockERC20')).deploy();
    this.usdc = await (await ethers.getContractFactory('MockERC20')).deploy();
    this.usdt = await (await ethers.getContractFactory('MockERC20')).deploy();

    this.mock3pool = await (await ethers.getContractFactory('MockCurve3pool')).deploy(this.dai.address, this.usdc.address, this.usdt.address);

    this.mockMetapool = await (await ethers.getContractFactory('MockCurveMetapool')).deploy(this.mock3pool.address, this.fei.address);

    this.deposit = await (await ethers.getContractFactory('StableSwapOperatorV1')).deploy(
      this.core.address,
      this.mockMetapool.address,
      this.mock3pool.address,
      '100', // 1% max slippage on deposit,
      '100000000000000000',
      `10${e18}`,
    );

    // add liquidity to 3pool
    await this.dai.mint(userAddress, `300000${e18}`);
    await this.usdc.mint(userAddress, `300000${e18}`);
    await this.usdt.mint(userAddress, `300000${e18}`);
    await this.dai.approve(this.mock3pool.address, `300000${e18}`, {from: userAddress});
    await this.usdc.approve(this.mock3pool.address, `300000${e18}`, {from: userAddress});
    await this.usdt.approve(this.mock3pool.address, `300000${e18}`, {from: userAddress});
    await this.mock3pool.add_liquidity([`300000${e18}`, `300000${e18}`, `300000${e18}`], 0, {from: userAddress});

    // add liquidity to metapool
    await this.fei.mint(userAddress, `900000${e18}`, {from: minterAddress});
    await this.fei.approve(this.mockMetapool.address, `900000${e18}`, {from: userAddress});
    await this.mock3pool.approve(this.mockMetapool.address, `900000${e18}`, {from: userAddress});
    await this.mockMetapool.add_liquidity([`900000${e18}`, `900000${e18}`], 0, {from: userAddress});
  });

  describe('deposit()', function() {
    it('should emit Deposit event on success', async function() {
      await this.dai.mint(this.deposit.address, `50000000${e18}`);
      await this.fei.mint(this.deposit.address, `51000000${e18}`, {from: minterAddress});
      const lpBalanceBefore = await this.mockMetapool.balanceOf(this.deposit.address);
      expectEvent(
        await this.deposit.deposit({from: pcvControllerAddress}),
        'Deposit',
        { _from: pcvControllerAddress, _amount: '49992501124831275308703694' }
      );
      const lpBalanceAfter = await this.mockMetapool.balanceOf(this.deposit.address);
      expect(lpBalanceAfter.sub(lpBalanceBefore)).to.be.equal(`100000000${e18}`);
    });
    it('should be callable by anyone, even if not PCVController', async function() {
      await this.dai.mint(this.deposit.address, `50000000${e18}`);
      await this.fei.mint(this.deposit.address, `51000000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: userAddress});
      expect(await this.mockMetapool.balanceOf(this.deposit.address)).to.be.equal(`100000000${e18}`);
    });
    it('should deposit DAI held in the contract', async function() {
      await this.dai.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `6000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      expect(await this.mockMetapool.balanceOf(this.deposit.address)).to.be.equal(`10000${e18}`);
    });
    it('should deposit USDC held in the contract', async function() {
      await this.usdc.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `6000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      expect(await this.mockMetapool.balanceOf(this.deposit.address)).to.be.equal(`10000${e18}`);
    });
    it('should deposit USDT held in the contract', async function() {
      await this.usdt.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `6000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      expect(await this.mockMetapool.balanceOf(this.deposit.address)).to.be.equal(`10000${e18}`);
    });
    it('should deposit 3crv held in the contract', async function() {
      await this.mock3pool.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `6000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      expect(await this.mockMetapool.balanceOf(this.deposit.address)).to.be.equal(`10000${e18}`);
    });
    it('should leave the pool in a balanced state', async function() {
      await this.dai.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `6000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      expect(await this.mock3pool.balanceOf(this.mockMetapool.address)).to.be.equal(`905000${e18}`);
      expect(await this.fei.balanceOf(this.mockMetapool.address)).to.be.equal(`905000${e18}`);
    });
    it('should keep excess FEI', async function() {
      await this.dai.mint(this.deposit.address, `50000000${e18}`);
      await this.fei.mint(this.deposit.address, `51000000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      expect(await this.fei.balanceOf(this.deposit.address)).to.be.equal(`1000000${e18}`);
      expect(await this.fei.balanceOf(this.mockMetapool.address)).to.be.equal(`50900000${e18}`);
    });
    it('should revert if not enough FEI for tokens held', async function() {
      await this.dai.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `1000${e18}`, {from: minterAddress});
      await expectRevert(this.deposit.deposit({from: pcvControllerAddress}), 'ERC20: transfer amount exceeds balance');
    });
    it('should revert if slippage is too high in metapool', async function() {
      await this.mockMetapool.set_slippage('1000'); // 10% slippage
      await this.dai.mint(this.deposit.address, `50000000${e18}`);
      await this.fei.mint(this.deposit.address, `51000000${e18}`, {from: minterAddress});
      await expectRevert(this.deposit.deposit({from: pcvControllerAddress}), 'StableSwapOperatorV1: metapool deposit slippage too high');
    });
    it('should revert if slippage is too high in 3pool', async function() {
      await this.mock3pool.set_slippage('1000'); // 10% slippage
      await this.dai.mint(this.deposit.address, `50000000${e18}`);
      await this.fei.mint(this.deposit.address, `51000000${e18}`, {from: minterAddress});
      await expectRevert(this.deposit.deposit({from: pcvControllerAddress}), 'StableSwapOperatorV1: 3pool deposit slippage too high');
    });
  });

  describe('withdraw()', function() {
    beforeEach(async function() {
      // make the deposit non-empty
      await this.mockMetapool.transfer(this.deposit.address, `6000${e18}`, {from: userAddress});
    });
    it('should emit Withdrawal event on success', async function() {
      expect(await this.dai.balanceOf(userAddress)).to.be.equal('0');
      expectEvent(
        await this.deposit.withdraw(userAddress, `1000${e18}`, {from: pcvControllerAddress}),
        'Withdrawal',
        { _caller: pcvControllerAddress, _to: userAddress, _amount: `1000${e18}` }
      );
      expect(await this.dai.balanceOf(userAddress)).to.be.equal(`1000${e18}`);
    });
    it('should revert if not PCVController', async function() {
      await expectRevert(this.deposit.withdraw(userAddress, `1000${e18}`, {from: userAddress}), 'CoreRef: Caller is not a PCV controller');
    });
    it('should revert if amount=0', async function() {
      await expectRevert(this.deposit.withdraw(userAddress, `0${e18}`, {from: pcvControllerAddress}), 'StableSwapOperatorV1: Cannot withdraw 0');
    });
    it('should not transfer tokens if target=self', async function() {
      expect(await this.dai.balanceOf(this.deposit.address)).to.be.equal('0');
      await this.deposit.withdraw(this.deposit.address, `2000${e18}`, {from: pcvControllerAddress});
      expect(await this.dai.balanceOf(this.deposit.address)).to.be.equal(`2000${e18}`);
    });
    it('should keep excess FEI', async function() {
      expect(await this.dai.balanceOf(this.deposit.address)).to.be.equal('0');
      expect(await this.fei.balanceOf(this.deposit.address)).to.be.equal('0');
      await this.deposit.withdraw(this.deposit.address, `2000${e18}`, {from: pcvControllerAddress});
      expect(await this.dai.balanceOf(this.deposit.address)).to.be.equal(`2000${e18}`);
      expect(await this.fei.balanceOf(this.deposit.address)).to.be.equal('2000300000000000000000');
    });
    it('should revert if trying to withdraw amount > balance', async function() {
      await expectRevert(this.deposit.withdraw(userAddress, `123456789${e18}`, {from: pcvControllerAddress}), 'StableSwapOperatorV1: 3pool withdraw slippage too high');
    });
    it('should leave tokens in the pool if partial withdraw', async function() {
      expect(await this.dai.balanceOf(userAddress)).to.be.equal('0');
      expect(await this.mock3pool.balanceOf(this.mockMetapool.address)).to.be.equal(`900000${e18}`);
      expect(await this.fei.balanceOf(this.mockMetapool.address)).to.be.equal(`900000${e18}`);
      expect(await this.dai.balanceOf(this.mock3pool.address)).to.be.equal(`300000${e18}`);
      expect(await this.usdc.balanceOf(this.mock3pool.address)).to.be.equal(`300000${e18}`);
      expect(await this.usdt.balanceOf(this.mock3pool.address)).to.be.equal(`300000${e18}`);
      await this.deposit.withdraw(userAddress, `1000${e18}`, {from: pcvControllerAddress});
      expect(await this.dai.balanceOf(userAddress)).to.be.equal(`1000${e18}`);
      expect(await this.mock3pool.balanceOf(this.mockMetapool.address)).to.be.equal('898999850000000000000000');
      expect(await this.fei.balanceOf(this.mockMetapool.address)).to.be.equal('898999850000000000000000');
      expect(await this.dai.balanceOf(this.mock3pool.address)).to.be.equal(`299000${e18}`);
      expect(await this.usdc.balanceOf(this.mock3pool.address)).to.be.equal(`300000${e18}`);
      expect(await this.usdt.balanceOf(this.mock3pool.address)).to.be.equal(`300000${e18}`);
    });
    it('should revert if slippage is too high in 3pool', async function() {
      await this.mock3pool.set_slippage('1000'); // 10% slippage
      await expectRevert(
        this.deposit.withdraw(userAddress, `1000${e18}`, {from: pcvControllerAddress}),
        'StableSwapOperatorV1: 3pool withdraw slippage too high'
      );
    });
    it('should tolerate a small slippage', async function() {
      await this.mock3pool.set_slippage('50'); // 0.5% slippage
      await this.deposit.withdraw(userAddress, `1000${e18}`, {from: pcvControllerAddress});
      expect(await this.dai.balanceOf(userAddress)).to.be.equal(`995${e18}`);
    });
  });
  describe('balance()', function() {
    it('should return the current balance, excluding FEI', async function() {
      await this.dai.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `6000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      expect(await this.deposit.balance()).to.be.equal('4999250112483127530870');
    });
    it('should take 3pool slippage into account', async function() {
      await this.dai.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `6000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      await this.mock3pool.set_slippage('50'); // 0.5% slippage
      expect(await this.deposit.balance()).to.be.equal('4974253861920711893216');
    });
  });
  describe('balanceReportedIn()', function() {
    it('should return the DAI address', async function() {
      expect(await this.deposit.balanceReportedIn()).to.be.equal(this.dai.address);
    });
  });
  describe('resistantBalanceAndFei()', function() {
    it('should return the current balance as half of the USD of LP tokens', async function() {
      await this.dai.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `6000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      expect((await this.deposit.resistantBalanceAndFei()).resistantBalance).to.be.equal(`5000${e18}`);
    });
    it('should return the FEI as half of the USD value of LP tokens', async function() {
      await this.dai.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `6000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      expect((await this.deposit.resistantBalanceAndFei()).resistantFei).to.be.equal(`5000${e18}`);
    });
    it('should revert if a peg is broken (amount in pool differs more than 50%)', async function() {
      await this.dai.mint(this.deposit.address, `5000${e18}`);
      await this.fei.mint(this.deposit.address, `6000${e18}`, {from: minterAddress});
      await this.deposit.deposit({from: pcvControllerAddress});
      expect((await this.deposit.resistantBalanceAndFei()).resistantFei).to.be.equal(`5000${e18}`);
      await this.fei.mint(this.mockMetapool.address, `10000000${e18}`, {from: minterAddress});
      await expectRevert(this.deposit.resistantBalanceAndFei(), 'StableSwapOperatorV1: broken peg');
    });
  });
});
