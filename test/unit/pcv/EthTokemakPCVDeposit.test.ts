import { expectRevert, balance, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

describe('EthTokemakPCVDeposit', function () {
  let userAddress: string;
  let pcvControllerAddress: string;
  let governorAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.beneficiaryAddress1
    ];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, pcvControllerAddress, governorAddress } = await getAddresses());

    this.core = await getCore();
    this.weth = await (await ethers.getContractFactory('MockWeth')).deploy();
    this.toke = await (await ethers.getContractFactory('MockERC20')).deploy();
    this.pool = await (await ethers.getContractFactory('MockTokemakEthPool')).deploy(this.weth.address);
    this.rewards = await (await ethers.getContractFactory('MockTokemakRewards')).deploy(this.toke.address);
    this.deposit = await (
      await ethers.getContractFactory('EthTokemakPCVDeposit')
    ).deploy(this.core.address, this.pool.address, this.rewards.address);

    this.depositAmount = toBN('10000000000000000000'); // 10 ETH
  });

  describe('Deposit', function () {
    it('reverts if paused', async function () {
      await this.deposit.connect(impersonatedSigners[governorAddress]).pause({});
      await expectRevert(this.deposit.deposit(), 'Pausable: paused');
    });

    it('succeeds if not paused', async function () {
      // seed the deposit with eth
      await (
        await ethers.getSigner(userAddress)
      ).sendTransaction({ to: this.deposit.address, value: this.depositAmount });

      expect(await this.deposit.balance()).to.be.equal(toBN(0));
      await this.deposit.deposit();
      // Balance should increment with the new deposited cTokens underlying
      expect(await this.deposit.balance()).to.be.equal(this.depositAmount);

      // Held balance should be 0, now invested into Tokemak
      expect((await balance.current(this.deposit.address)).toString()).to.be.equal('0');
    });
  });

  describe('Withdraw', function () {
    it('reverts if paused', async function () {
      await this.deposit.connect(impersonatedSigners[governorAddress]).pause({});
      await expectRevert(
        this.deposit.connect(impersonatedSigners[pcvControllerAddress]).withdraw(userAddress, this.depositAmount, {}),
        'Pausable: paused'
      );
    });

    it('reverts if not PCVController', async function () {
      await expectRevert(
        this.deposit.connect(impersonatedSigners[userAddress]).withdraw(userAddress, this.depositAmount, {}),
        'CoreRef: Caller is not a PCV controller'
      );
    });

    it('reverts if requestWithdrawal has not been called', async function () {
      // deposit in the PCVDeposit
      await (
        await ethers.getSigner(userAddress)
      ).sendTransaction({ to: this.deposit.address, value: this.depositAmount });
      await this.deposit.deposit();

      await expectRevert(
        this.deposit.connect(impersonatedSigners[pcvControllerAddress]).withdraw(userAddress, this.depositAmount, {}),
        'WITHDRAW_INSUFFICIENT_BALANCE'
      );
    });

    it('succeeds if requestWithdrawal has been called', async function () {
      // deposit in the PCVDeposit
      await (
        await ethers.getSigner(userAddress)
      ).sendTransaction({ to: this.deposit.address, value: this.depositAmount });
      await this.deposit.deposit();

      const userBalanceBefore = await balance.current(userAddress);

      // request withdrawal
      await this.deposit.connect(impersonatedSigners[governorAddress]).requestWithdrawal(this.depositAmount, {});

      // withdrawing should take balance back to 0
      expect(await this.deposit.balance()).to.be.equal(this.depositAmount);
      await this.deposit
        .connect(impersonatedSigners[pcvControllerAddress])
        .withdraw(userAddress, this.depositAmount, {});
      expect(Number((await this.deposit.balance()).toString())).to.be.equal(0);

      const userBalanceAfter = await balance.current(userAddress);

      expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(this.depositAmount);
    });
  });

  describe('Withdraw ERC20', function () {
    it('reverts if not PCVController', async function () {
      await expectRevert(
        this.deposit
          .connect(impersonatedSigners[userAddress])
          .withdrawERC20(this.weth.address, userAddress, this.depositAmount, {}),
        'CoreRef: Caller is not a PCV controller'
      );
    });

    it('succeeds if called as PCVController', async function () {
      // deposit in PCVDeposit
      await (
        await ethers.getSigner(userAddress)
      ).sendTransaction({ from: userAddress, to: this.deposit.address, value: this.depositAmount });
      await this.deposit.deposit();

      expect(await this.deposit.balance()).to.be.equal(this.depositAmount);

      // send half of pool tokens somewhere else
      await this.deposit
        .connect(impersonatedSigners[pcvControllerAddress])
        .withdrawERC20(this.pool.address, userAddress, this.depositAmount.div(toBN('2')), {});

      // balance should also get cut in half
      expect(await this.deposit.balance()).to.be.equal(this.depositAmount.div(toBN('2')));
      // user should have received the pool tokens
      expect(await this.pool.balanceOf(userAddress)).to.be.equal(this.depositAmount.div(toBN('2')));
    });
  });

  describe('Claim Rewards', function () {
    it('reverts if paused', async function () {
      await this.deposit.connect(impersonatedSigners[governorAddress]).pause({});
      await expectRevert(
        this.deposit.claimRewards(
          '1', // chainId
          '83', // cycle
          userAddress, // wallet,
          '524310123843078144915', // amount
          '27', // v
          '0x4fa17a99b5c319727c9a7c846112902f88d8a261049e70737cd1d60e52609c50', // r
          '0x44ab278ba36dedbd9b06ceb6c60f884dbaeacb8b3ac4043b901267a2af02ef6f', // s
          {}
        ),
        'Pausable: paused'
      );
    });

    it('should claim TOKE rewards & leave them on the deposit', async function () {
      const rewardAddress = '0x4eff3562075c5d2d9cb608139ec2fe86907005fa';
      const userBalanceBefore = await this.toke.balanceOf(rewardAddress);

      await this.deposit.connect(impersonatedSigners[userAddress]).claimRewards(
        '1', // chainId
        '83', // cycle
        rewardAddress, // wallet,
        '524310123843078144915', // amount
        '27', // v
        '0x4fa17a99b5c319727c9a7c846112902f88d8a261049e70737cd1d60e52609c50', // r
        '0x44ab278ba36dedbd9b06ceb6c60f884dbaeacb8b3ac4043b901267a2af02ef6f', // s
        {}
      );

      const userBalanceAfter = await this.toke.balanceOf(rewardAddress);

      expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal('524310123843078144915');
    });
  });
});
