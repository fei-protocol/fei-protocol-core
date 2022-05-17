import { time, expectRevert, expectEvent, getCore, getAddresses, getImpersonatedSigner } from '@test/helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';

const e18 = '000000000000000000';
const toBN = ethers.BigNumber.from;
const ONE = ethers.constants.WeiPerEther.mul('1');

describe('PCVSwapperUniswap', function () {
  let userAddress: string;
  let secondUserAddress: string;
  let pcvControllerAddress: string;
  let userSigner: Signer;
  let governorSigner: Signer;
  let minterSigner: Signer;
  let pcvControllerSigner: Signer;
  let secondUserSigner: Signer;
  let pcvMinorParamSigner: Signer;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.governorAddress,
      addresses.minterAddress,
      addresses.pcvControllerAddress,
      addresses.secondUserAddress
    ];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
    userSigner = impersonatedSigners[addresses.userAddress];
    governorSigner = impersonatedSigners[addresses.governorAddress];
    minterSigner = impersonatedSigners[addresses.minterAddress];
    pcvControllerSigner = impersonatedSigners[addresses.pcvControllerAddress];
    secondUserSigner = impersonatedSigners[addresses.secondUserAddress];
  });

  beforeEach(async function () {
    ({ userAddress, pcvControllerAddress, secondUserAddress } = await getAddresses());
    this.core = await getCore();
    await this.core.connect(governorSigner).grantMinter(userAddress);

    this.weth = await (await ethers.getContractFactory('MockWeth')).deploy();
    this.fei = await ethers.getContractAt('Fei', await this.core.fei());

    this.pair = await (
      await ethers.getContractFactory('MockUniswapV2PairLiquidity')
    ).deploy(this.fei.address, this.weth.address);
    this.pair.setReserves('62500000' + e18, '25000' + e18);
    await this.fei.connect(minterSigner).mint(this.pair.address, '62500000' + e18);
    this.oracle = await (await ethers.getContractFactory('MockOracle')).deploy(2500); // 2500:1 oracle price

    this.swapper = await (
      await ethers.getContractFactory('PCVSwapperUniswap')
    ).deploy(
      this.core.address, // core
      this.pair.address, // pair
      this.oracle.address, // oracle
      this.weth.address, // weth
      '1000', // default minimum interval between swaps
      this.weth.address, // tokenSpent
      this.fei.address, // tokenReceived
      userAddress, // tokenReceivingAddress
      '100' + e18, // maxSpentPerSwap
      '300', // maximumSlippageBasisPoints
      false, // invertOraclePrice
      '200' + e18 // swap incentive = 200 FEI
    );

    await this.core.connect(governorSigner).grantPCVController(pcvControllerAddress);

    // Create the PCV_MINOR_PARAM_ROLE and grant it to a calling address
    await this.core
      .connect(governorSigner)
      .createRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), ethers.utils.id('GOVERN_ROLE'));

    await this.core.connect(governorSigner).grantRole(ethers.utils.id('PCV_MINOR_PARAM_ROLE'), secondUserAddress);
    pcvMinorParamSigner = await getImpersonatedSigner(secondUserAddress);
  });

  describe('Payable', function () {
    it('should mint WETH on ETH reception', async function () {
      // send 23 ETH
      await userSigner.sendTransaction({ to: this.swapper.address, value: '23' + e18 });
      const wethBalance = await this.weth.balanceOf(this.swapper.address);
      expect(wethBalance).to.be.bignumber.equal(ethers.constants.WeiPerEther.mul(23));
    });
  });

  describe('IPCVSwapper interface override', function () {
    describe('Getters', function () {
      it('tokenSpent()', async function () {
        expect(await this.swapper.tokenSpent()).to.equal(this.weth.address);
      });
      it('tokenReceived()', async function () {
        expect(await this.swapper.tokenReceived()).to.equal(this.fei.address);
      });
      it('tokenReceivingAddress()', async function () {
        expect(await this.swapper.tokenReceivingAddress()).to.equal(userAddress);
      });
    });
    describe('Setters', function () {
      describe('As Governor', function () {
        it('setTokenSpent() emit UpdateTokenSpent', async function () {
          expectEvent(
            await this.swapper.connect(pcvMinorParamSigner).setTokenSpent('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
            this.swappper,
            'UpdateTokenSpent',
            ['0x6B175474E89094C44Da98b954EedeAC495271d0F']
          );
        });
        it('setTokenReceived() emit UpdateTokenReceived', async function () {
          expectEvent(
            await this.swapper
              .connect(pcvMinorParamSigner)
              .setTokenReceived('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
            this.swapper,
            'UpdateTokenReceived',
            ['0x6B175474E89094C44Da98b954EedeAC495271d0F']
          );
        });
        it('setReceivingAddress() emit UpdateReceivingAddress', async function () {
          expectEvent(
            await this.swapper.connect(pcvMinorParamSigner).setReceivingAddress(userAddress),
            this.swapper,
            'UpdateReceivingAddress',
            [userAddress] // tokenReceivingAddress
          );
        });
      });
      describe('As Anyone', function () {
        it('revert setTokenSpent() PCV_MINOR_ADMIN_ROLE', async function () {
          await expectRevert(this.swapper.setTokenSpent('0x6B175474E89094C44Da98b954EedeAC495271d0F'), 'UNAUTHORIZED');
        });
        it('revert setTokenReceived() PCV_MINOR_ADMIN_ROLE', async function () {
          await expectRevert(
            this.swapper.setTokenReceived('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
            'UNAUTHORIZED'
          );
        });
        it('revert setReceivingAddress() PCV_MINOR_ADMIN_ROLE', async function () {
          await expectRevert(this.swapper.setReceivingAddress(userAddress), 'UNAUTHORIZED');
        });
      });
    });
    describe('Withdraw', function () {
      describe('As PCVController', function () {
        it('revert withdrawETH() insufficient balance (all ETH is wrapped)', async function () {
          // send 1 ETH, gets converted to 1 WETH
          await userSigner.sendTransaction({ to: this.swapper.address, value: '1' + e18 });
          await expectRevert(
            this.swapper.connect(pcvControllerSigner).withdrawETH(userAddress, 1),
            'Address: insufficient balance'
          );
        });
        it('withdrawERC20() emit WithdrawERC20', async function () {
          expect(await this.fei.balanceOf(this.swapper.address)).to.be.bignumber.equal(toBN('0'));
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(toBN('0'));
          await this.fei.connect(minterSigner).mint(this.swapper.address, '1' + e18);
          expect(await this.fei.balanceOf(this.swapper.address)).to.be.bignumber.equal(ONE);
          expectEvent(
            await this.swapper.connect(pcvControllerSigner).withdrawERC20(userAddress, this.fei.address, '1' + e18),
            this.swapper,
            'WithdrawERC20',
            [pcvControllerAddress, userAddress, this.fei.address, '1' + e18]
          );
          expect(await this.fei.balanceOf(this.swapper.address)).to.be.bignumber.equal(toBN('0'));
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(ONE);
        });
      });
      describe('As Anyone', function () {
        it('revert withdrawETH() onlyPCVController', async function () {
          await expectRevert(this.swapper.withdrawETH(userAddress, 1), 'CoreRef: Caller is not a PCV controller');
        });
        it('revert withdrawERC20() onlyPCVController', async function () {
          await expectRevert(
            this.swapper.withdrawERC20(userAddress, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 1),
            'CoreRef: Caller is not a PCV controller'
          );
        });
      });
    });
    describe('Swap', function () {
      it('swap() emit Swap', async function () {
        await time.increase('1000');
        await userSigner.sendTransaction({ to: this.swapper.address, value: '100' + e18 });
        expectEvent(await this.swapper.connect(userSigner).swap(), this.swapper, 'Swap', [
          userAddress,
          this.weth.address,
          this.fei.address,
          '100' + e18,
          '248259939361825041733566' // not exactly 250000e18 because of slippage & fees]
        ]);
      });
    });
  });

  describe('Getters', function () {
    it('getOraclePrice()', async function () {
      expect(await this.swapper.getOraclePrice()).to.be.bignumber.equal(toBN('2500'));
    });
    it('getNextAmountSpent()', async function () {
      await userSigner.sendTransaction({ to: this.swapper.address, value: '100' + e18 });
      expect(await this.swapper.getNextAmountSpent()).to.be.bignumber.equal(toBN('100000000000000000000')); // 100e18
    });
    it('getNextAmountReceived()', async function () {
      await userSigner.sendTransaction({ to: this.swapper.address, value: '100' + e18 });
      expect(await this.swapper.getNextAmountReceived()).to.be.bignumber.equal(toBN('248259939361825041733566'));
    });
    it('getNextAmountReceivedThreshold()', async function () {
      await userSigner.sendTransaction({ to: this.swapper.address, value: '100' + e18 });
      expect(await this.swapper.getNextAmountReceivedThreshold()).to.be.bignumber.equal(
        toBN('242500000000000000000000')
      );
    });
    it('getDecimalNormalizer()', async function () {
      const decimalNormalizer = await this.swapper.getDecimalNormalizer();
      expect(decimalNormalizer[0]).to.be.bignumber.equal(toBN('1'));
      expect(decimalNormalizer[1]).to.be.equal(true);
    });
  });

  describe('Setters', function () {
    it('setMaximumSlippage() revert if not PCV_MINOR_PARAM_ROLE', async function () {
      const newLocal = 'UNAUTHORIZED';
      await expectRevert(this.swapper.setMaximumSlippage(toBN('500')), newLocal);
    });
    it('setMaximumSlippage() revert on invalid value', async function () {
      await expectRevert(
        this.swapper.connect(pcvMinorParamSigner).setMaximumSlippage(toBN('10001')),
        'PCVSwapperUniswap: Exceeds bp granularity.'
      );
    });
    it('setMaximumSlippage()', async function () {
      expect(await this.swapper.maximumSlippageBasisPoints()).to.be.bignumber.equal(toBN('300'));
      await this.swapper.connect(pcvMinorParamSigner).setMaximumSlippage(toBN('500'));
      expect(await this.swapper.maximumSlippageBasisPoints()).to.be.bignumber.equal(toBN('500'));
    });
    it('setMaxSpentPerSwap() revert if not PCV_MINOR_ADMIN_ROLE', async function () {
      await expectRevert(this.swapper.setMaxSpentPerSwap(toBN('0')), 'UNAUTHORIZED');
    });
    it('setMaxSpentPerSwap() revert on invalid value', async function () {
      await expectRevert(
        this.swapper.connect(pcvMinorParamSigner).setMaxSpentPerSwap(toBN('0')),
        'PCVSwapperUniswap: Cannot swap 0.'
      );
    });
    it('setMaxSpentPerSwap()', async function () {
      expect(await this.swapper.maxSpentPerSwap()).to.be.bignumber.equal(ethers.constants.WeiPerEther.mul('100'));
      await this.swapper.connect(pcvMinorParamSigner).setMaxSpentPerSwap('50' + e18);
      expect(await this.swapper.maxSpentPerSwap()).to.be.bignumber.equal(ethers.constants.WeiPerEther.mul('50'));
    });
    it('setTokenBuyLimit() revert if not PCV_MINOR_ADMIN_ROLE', async function () {
      await expectRevert(this.swapper.setTokenBuyLimit(ethers.constants.WeiPerEther.mul('500000')), 'UNAUTHORIZED');
    });
    it('setTokenBuyLimit()', async function () {
      expect(await this.swapper.tokenBuyLimit()).to.be.bignumber.equal(toBN('0'));
      await this.swapper.connect(pcvMinorParamSigner).setTokenBuyLimit('500000' + e18);
      expect(await this.swapper.tokenBuyLimit()).to.be.bignumber.equal(ethers.constants.WeiPerEther.mul('500000'));
    });
    it('setSwapFrequency() revert if not PCV_MINOR_ADMIN_ROLE', async function () {
      await expectRevert(this.swapper.setSwapFrequency(ethers.constants.WeiPerEther.mul('2000')), 'UNAUTHORIZED');
    });
    it('setSwapFrequency()', async function () {
      expect(await this.swapper.getSwapFrequency()).to.be.bignumber.equal(toBN('1000'));
      await this.swapper.connect(pcvMinorParamSigner).setSwapFrequency('2000');
      expect(await this.swapper.getSwapFrequency()).to.be.bignumber.equal(toBN('2000'));
    });
    it('setInvertOraclePrice() revert if not PCV_MINOR_ADMIN_ROLE', async function () {
      await expectRevert(this.swapper.setInvertOraclePrice(true), 'UNAUTHORIZED');
    });
    it('setInvertOraclePrice()', async function () {
      expect(await this.swapper.invertOraclePrice()).to.be.equal(false);
      await this.swapper.connect(pcvMinorParamSigner).setInvertOraclePrice(true);
      expect(await this.swapper.invertOraclePrice()).to.be.equal(true);
    });
  });

  describe('Swap', function () {
    it('revert if paused by guardian', async function () {
      await time.increase('1000');
      await this.swapper.connect(governorSigner).pause();
      await expectRevert(this.swapper.swap(), 'Pausable: paused');
    });
    it('revert if paused by governor', async function () {
      await time.increase('1000');
      await this.swapper.connect(governorSigner).pause();
      await expectRevert(this.swapper.swap(), 'Pausable: paused');
    });
    it('revert if time is not elapsed', async function () {
      await expectRevert(this.swapper.swap(), 'Timed: time not ended');
    });
    it('revert if buy limit is exceeded', async function () {
      await time.increase('1000');
      await userSigner.sendTransaction({ to: this.swapper.address, value: '50' + e18 });
      await this.swapper.connect(pcvMinorParamSigner).setTokenBuyLimit('1');
      // first swap is successful but pushes the target's balance above limit
      await this.swapper.connect(userSigner).swap();
      expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(toBN('124376992277398866659880'));
      await time.increase('1000');
      // second swap fails because the target's balance is above limit
      await expectRevert(this.swapper.swap(), 'PCVSwapperUniswap: tokenBuyLimit reached.');
    });
    it('revert if oracle is invalid', async function () {
      await this.oracle.setValid(false);
      await time.increase('1000');
      await userSigner.sendTransaction({ to: this.swapper.address, value: '100' + e18 });
      await expectRevert(this.swapper.swap(), 'OracleRef: oracle invalid');
    });
    it('revert if slippage is too high', async function () {
      await time.increase('1000');
      await userSigner.sendTransaction({ to: this.swapper.address, value: '1000' + e18 });
      await this.swapper.connect(pcvMinorParamSigner).setMaxSpentPerSwap(ethers.constants.WeiPerEther.mul('1000'));
      await expectRevert(this.swapper.swap(), 'PCVSwapperUniswap: slippage too high.');
    });
    it('send tokens to tokenReceivingAddress', async function () {
      await time.increase('1000');
      await userSigner.sendTransaction({ to: this.swapper.address, value: '100' + e18 });
      await this.swapper.connect(userSigner).swap();
      expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(toBN('248259939361825041733566'));
    });
    it('swap remaining tokens if balance < maxSpentPerSwap', async function () {
      await time.increase('1000');
      await userSigner.sendTransaction({ to: this.swapper.address, value: '50' + e18 });
      await this.swapper.connect(userSigner).swap();
      expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(toBN('124376992277398866659880'));
    });
    it('no FEI incentive to caller if swapper is not a Minter', async function () {
      await time.increase('1000');
      await userSigner.sendTransaction({ to: this.swapper.address, value: '50' + e18 });
      expect((await this.fei.balanceOf(secondUserAddress)) / 1e18).to.be.equal(0);
      await this.swapper.connect(secondUserSigner).swap();
      expect((await this.fei.balanceOf(secondUserAddress)) / 1e18).to.be.equal(0);
    });
    it('send FEI incentive to caller if swapper is Minter', async function () {
      await time.increase('1000');
      await userSigner.sendTransaction({ to: this.swapper.address, value: '50' + e18 });
      await this.core.connect(governorSigner).grantMinter(this.swapper.address);
      expect((await this.fei.balanceOf(secondUserAddress)) / 1e18).to.be.equal(0);
      await this.swapper.connect(secondUserSigner).swap();
      expect((await this.fei.balanceOf(secondUserAddress)) / 1e18).to.be.equal(200);
    });
  });
});
