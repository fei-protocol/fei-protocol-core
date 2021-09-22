import ether from '@openzeppelin/test-helpers/src/ether';
import { expectRevert, expectEvent, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai'
import hre, { artifacts, ethers } from 'hardhat'

const EthLidoPCVDeposit = artifacts.readArtifactSync('EthLidoPCVDeposit');
const Fei = artifacts.readArtifactSync('Fei');
const MockStEthStableSwap = artifacts.readArtifactSync('MockStEthStableSwap');
const MockStEthToken = artifacts.readArtifactSync('MockStEthToken');

const e18 = '000000000000000000';

describe('EthLidoPCVDeposit', function () {
  let userAddress;
  let secondUserAddress;
  let governorAddress;
  let pcvControllerAddress;

  beforeEach(async function () {
    ({
      userAddress,
      secondUserAddress,
      governorAddress,
      pcvControllerAddress
    } = await getAddresses());

    this.core = await getCore(true);

    this.fei = await Fei.at(await this.core.fei());
    this.steth = await MockStEthToken.new();
    this.stableswap = await MockStEthStableSwap.new(this.steth.address);
    await this.steth.mintAt(this.stableswap.address);

    await forceEth(this.stableswap.address, ether('100'));

    this.pcvDeposit = await EthLidoPCVDeposit.new(
      this.core.address,
      this.steth.address,
      this.stableswap.address,
      '100' // maximum 1% slippage tolerated
    );
  });

  describe('receive()', function() {
    it('should accept ETH transfers', async function() {
      // send 23 ETH
      await web3.eth.sendTransaction({from: userAddress, to: this.pcvDeposit.address, value: `23${e18}`});
      expect(await web3.eth.getBalance(this.pcvDeposit.address)).to.be.bignumber.equal(`23${e18}`);
    });
  });

  describe('setMaximumSlippage()', function() {
    it('should revert if not governor', async function() {
      await expectRevert(
        this.pcvDeposit.setMaximumSlippage('500'),
        'CoreRef: Caller is not a governor'
      );
    });
    it('should revert on invalid value', async function() {
      await expectRevert(
        this.pcvDeposit.setMaximumSlippage('10001', { from: governorAddress }),
        'EthLidoPCVDeposit: Exceeds bp granularity.'
      );
    });
    it('should emit UpdateMaximumSlippage', async function() {
      expect(await this.pcvDeposit.maximumSlippageBasisPoints()).to.be.bignumber.equal('100');
      await expectEvent(
        await this.pcvDeposit.setMaximumSlippage('500', { from: governorAddress }),
        'UpdateMaximumSlippage',
        {
          maximumSlippageBasisPoints: '500'
        }
      );
      expect(await this.pcvDeposit.maximumSlippageBasisPoints()).to.be.bignumber.equal('500');
    });
  });

  describe('IPCVDeposit interface override', function() {
    describe('balance()', function() {
      it('should return the amount of stETH held', async function() {
        expect(await this.pcvDeposit.balance()).to.be.bignumber.equal('0');
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal('0');
        await this.steth.mintAt(this.pcvDeposit.address);
        expect(await this.pcvDeposit.balance()).to.be.bignumber.equal(`100000${e18}`);
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(`100000${e18}`);
      });
    });

    describe('deposit()', function() {
      it('should revert if no ETH is on the contract', async function() {
        expect(await web3.eth.getBalance(this.pcvDeposit.address)).to.be.bignumber.equal('0');
        await expectRevert(
          this.pcvDeposit.deposit(),
          'EthLidoPCVDeposit: cannot deposit 0.'
        );
      });
      it('should emit Deposit', async function() {
        await web3.eth.sendTransaction({from: userAddress, to: this.pcvDeposit.address, value: `1${e18}`});
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal('0');
        await expectEvent(
          await this.pcvDeposit.deposit(),
          'Deposit',
          {
            _from: userAddress,
            _amount: `1${e18}`
          }
        );
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(`1${e18}`);
      });
      it('should use Curve if slippage is negative', async function() {
        await web3.eth.sendTransaction({from: userAddress, to: this.pcvDeposit.address, value: `1${e18}`});
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal('0');
        await this.stableswap.setSlippage(1000, true); // 10% negative slippage (bonus) for ETH -> stETH
        await this.pcvDeposit.deposit();
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal('1100000000000000000'); // got 1.1 stETH
      });
      it('should directly stake if slippage is positive', async function() {
        await web3.eth.sendTransaction({from: userAddress, to: this.pcvDeposit.address, value: `1${e18}`});
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal('0');
        await this.stableswap.setSlippage(1000, false); // 10% positive slippage (disadvantage) for ETH -> stETH
        await this.pcvDeposit.deposit();
        // didn't get 0.9 stETH out of a swap Curve, but did a direct 1:1 deposit directly on Lido
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(`1${e18}`);
      });
    });

    describe('withdraw()', function() {
      it('should emit Withdrawal', async function() {
        await this.steth.mintAt(this.pcvDeposit.address);
        const balanceBeforeWithdraw = new BN(await web3.eth.getBalance(secondUserAddress));
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(`100000${e18}`);
        await expectEvent(
          await this.pcvDeposit.withdraw(secondUserAddress, `1${e18}`, {from: pcvControllerAddress}),
          'Withdrawal',
          {
            _caller: pcvControllerAddress,
            _to: secondUserAddress,
            _amount: `1${e18}`
          }
        );
        const balanceAfterWithdraw = new BN(await web3.eth.getBalance(secondUserAddress));
        expect(balanceAfterWithdraw.sub(balanceBeforeWithdraw)).to.be.bignumber.equal(`1${e18}`);
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(`99999${e18}`);
      });
      it('should revert if slippage is too high', async function() {
        await this.steth.mintAt(this.pcvDeposit.address);
        await this.stableswap.setSlippage(1000, false); // 10% positive slippage (disavantage) for stETH -> ETH
        await expectRevert(
          this.pcvDeposit.withdraw(userAddress, `1${e18}`, {from: pcvControllerAddress}),
          'EthLidoPCVDeposit: slippage too high.'
        );
      });
      it('should revert if trying to withdraw more than balance', async function() {
        await this.steth.mintAt(this.pcvDeposit.address);
        await expectRevert(
          this.pcvDeposit.withdraw(userAddress, `100001${e18}`, {from: pcvControllerAddress}),
          'EthLidoPCVDeposit: not enough stETH.'
        );
      });
      it('should revert if not PCVController', async function() {
        await expectRevert(
          this.pcvDeposit.withdraw(userAddress, 1),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('withdrawERC20()', function() {
      it('should emit WithdrawERC20', async function() {
        await this.steth.mintAt(this.pcvDeposit.address);
        expect(await this.steth.balanceOf(secondUserAddress)).to.be.bignumber.equal('0');
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(`100000${e18}`);
        await expectEvent(
          await this.pcvDeposit.withdrawERC20(this.steth.address, secondUserAddress, `1${e18}`, {from: pcvControllerAddress}),
          'WithdrawERC20',
          {
            _caller: pcvControllerAddress,
            _token: this.steth.address,
            _to: secondUserAddress,
            _amount: `1${e18}`
          }
        );
        expect(await this.steth.balanceOf(secondUserAddress)).to.be.bignumber.equal(`1${e18}`);
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(`99999${e18}`);
      });
      it('should revert if not PCVController', async function() {
        await expectRevert(
          this.pcvDeposit.withdrawERC20(this.fei.address, userAddress, 1),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });
  });

  describe('withdrawETH()', function() {
    it('should emit WithdrawETH', async function() {
      const balanceBeforeWithdraw = new BN(await web3.eth.getBalance(secondUserAddress));
      await web3.eth.sendTransaction({from: userAddress, to: this.pcvDeposit.address, value: `1${e18}`});
      await expectEvent(
        await this.pcvDeposit.withdrawETH(secondUserAddress, `1${e18}`, {from: pcvControllerAddress}),
        'WithdrawETH',
        {
          _caller: pcvControllerAddress,
          _to: secondUserAddress,
          _amount: `1${e18}`
        }
      );
      const balanceAfterWithdraw = new BN(await web3.eth.getBalance(secondUserAddress));
      expect(balanceAfterWithdraw.sub(balanceBeforeWithdraw)).to.be.bignumber.equal(`1${e18}`);
    });
    it('should revert if trying to withdraw more than balance', async function() {
      await expectRevert(
        this.pcvDeposit.withdrawETH(userAddress, `100001${e18}`, {from: pcvControllerAddress}),
        'Address: insufficient balance'
      );
    });
    it('should revert if not PCVController', async function() {
      await expectRevert(
        this.pcvDeposit.withdraw(userAddress, 1),
        'CoreRef: Caller is not a PCV controller'
      );
    });
  });
});
