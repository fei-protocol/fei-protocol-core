import { getImpersonatedSigner, balance, getAddresses, getCore } from '@test/helpers';
import chai, { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';
import {
  MockERC20,
  MockERC20__factory,
  MockWeth,
  MockWeth__factory,
  MockTokemakERC20Pool,
  MockTokemakERC20Pool__factory,
  MockTokemakRewards,
  MockTokemakRewards__factory,
  ERC20TokemakPCVDeposit,
  ERC20TokemakPCVDeposit__factory,
  Core
} from '@custom-types/contracts';

chai.config.includeStack = true;
const toBN = ethers.BigNumber.from;

describe('ERC20TokemakPCVDeposit', function () {
  let core: Core;
  let token: MockERC20;
  let toke: MockERC20;
  let pool: MockTokemakERC20Pool;
  let rewards: MockTokemakRewards;
  let deposit: ERC20TokemakPCVDeposit;

  let userAddress: string;
  let pcvControllerAddress: string;
  let governorAddress: string;

  let depositAmount;

  before(async () => {
    const addresses = await getAddresses();
    userAddress = addresses.userAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;
    governorAddress = addresses.governorAddress;
  });

  beforeEach(async function () {
    core = await getCore();
    token = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
    toke = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
    pool = await new MockTokemakERC20Pool__factory(await getImpersonatedSigner(userAddress)).deploy(token.address);
    rewards = await new MockTokemakRewards__factory(await getImpersonatedSigner(userAddress)).deploy(toke.address);
    deposit = await new ERC20TokemakPCVDeposit__factory(await getImpersonatedSigner(userAddress)).deploy(
      core.address,
      pool.address,
      rewards.address
    );

    depositAmount = ethers.utils.parseEther('10');
  });

  describe('Deposit', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(deposit.deposit()).to.be.revertedWith('Pausable: paused');
    });

    it('succeeds if not paused', async function () {
      // seed the deposit with eth
      await token.mint(deposit.address, depositAmount);

      expect(await deposit.balance()).to.be.equal(toBN(0));
      await deposit.deposit();
      // Balance should increment with the new deposited cTokens underlying
      expect(await deposit.balance()).to.be.equal(depositAmount);

      // Held balance should be 0, now invested into Tokemak
      expect((await balance.current(deposit.address)).toString()).to.be.equal('0');
    });
  });

  describe('Withdraw', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(
        deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, depositAmount)
      ).to.be.revertedWith('Pausable: paused');
    });

    it('reverts if not PCVController', async function () {
      await expect(
        deposit.connect(await getImpersonatedSigner(userAddress)).withdraw(userAddress, depositAmount)
      ).to.be.revertedWith('CoreRef: Caller is not a PCV controller');
    });

    it('reverts if requestWithdrawal has not been called', async function () {
      // deposit in the PCVDeposit
      await token.mint(deposit.address, depositAmount);
      await deposit.deposit();

      await expect(
        deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, depositAmount)
      ).to.be.revertedWith('WITHDRAW_INSUFFICIENT_BALANCE');
    });

    it('succeeds if requestWithdrawal has been called', async function () {
      // deposit in the PCVDeposit
      await token.mint(deposit.address, depositAmount);
      await deposit.deposit();

      const userBalanceBefore = await token.balanceOf(userAddress);

      // request withdrawal
      await deposit.connect(await getImpersonatedSigner(governorAddress)).requestWithdrawal(depositAmount);

      // withdrawing should take balance back to 0
      expect(await deposit.balance()).to.be.equal(depositAmount);
      await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, depositAmount);
      expect(Number((await deposit.balance()).toString())).to.be.equal(0);

      const userBalanceAfter = await token.balanceOf(userAddress);

      expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(depositAmount);
    });
  });

  describe('Withdraw ERC20', function () {
    it('reverts if not PCVController', async function () {
      await expect(
        deposit
          .connect(await getImpersonatedSigner(userAddress))
          .withdrawERC20(token.address, userAddress, depositAmount)
      ).to.be.revertedWith('CoreRef: Caller is not a PCV controller');
    });

    it('succeeds if called as PCVController', async function () {
      // deposit in PCVDeposit
      await token.mint(deposit.address, depositAmount);
      await deposit.deposit();

      expect(await deposit.balance()).to.be.equal(depositAmount);

      // send half of pool tokens somewhere else
      await deposit
        .connect(await getImpersonatedSigner(pcvControllerAddress))
        .withdrawERC20(pool.address, userAddress, depositAmount.div(toBN('2')));

      // balance should also get cut in half
      expect(await deposit.balance()).to.be.equal(depositAmount.div(toBN('2')));
      // user should have received the pool tokens
      expect(await pool.balanceOf(userAddress)).to.be.equal(depositAmount.div(toBN('2')));
    });
  });

  describe('Claim Rewards', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(
        deposit.claimRewards(
          '83', // cycle
          '524310123843078144915', // amount
          '27', // v
          '0x4fa17a99b5c319727c9a7c846112902f88d8a261049e70737cd1d60e52609c50', // r
          '0x44ab278ba36dedbd9b06ceb6c60f884dbaeacb8b3ac4043b901267a2af02ef6f' // s
        )
      ).to.be.revertedWith('Pausable: paused');
    });

    it('should claim TOKE rewards & leave them on the deposit', async function () {
      const userBalanceBefore = await toke.balanceOf(deposit.address);
      await deposit.connect(await getImpersonatedSigner(userAddress)).claimRewards(
        '83', // cycle
        '524310123843078144915', // amount
        '27', // v
        '0x4fa17a99b5c319727c9a7c846112902f88d8a261049e70737cd1d60e52609c50', // r
        '0x44ab278ba36dedbd9b06ceb6c60f884dbaeacb8b3ac4043b901267a2af02ef6f' // s
      );
      const userBalanceAfter = await toke.balanceOf(deposit.address);

      expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal('524310123843078144915');
    });
  });
});
