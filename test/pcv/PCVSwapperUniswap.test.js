const {
    time,
    userAddress,
    secondUserAddress,
    minterAddress,
    guardianAddress,
    governorAddress,
    pcvControllerAddress,
    web3,
    expectRevert,
    expectEvent,
    contract,
    expect,
    getCore
  } = require('../helpers');

  const PCVSwapperUniswap = contract.fromArtifact('PCVSwapperUniswap');
  const Fei = contract.fromArtifact('Fei');
  const MockOracle = contract.fromArtifact('MockOracle');
  const MockWeth = contract.fromArtifact('MockWeth');
  const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');

  const e18 = '000000000000000000';

  describe('PCVSwapperUniswap', function () {

    beforeEach(async function () {
      this.core = await getCore(true);
      this.weth = await MockWeth.new();
      this.fei = await Fei.at(await this.core.fei());
      this.pair = await MockPair.new(this.fei.address, this.weth.address);
      this.pair.setReserves('62500000'+e18, '25000'+e18);
      //await web3.eth.sendTransaction({from: userAddress, to: this.pair.address, value: '25000'+e18});
      await this.fei.mint(this.pair.address, '62500000'+e18, {from: minterAddress});
      this.oracle = await MockOracle.new(2500); // 2500:1 oracle price

      this.swapper = await PCVSwapperUniswap.new(
        this.core.address, // core
        this.pair.address, // pair
        this.weth.address, // weth
        this.oracle.address, // oracle
        '1000', // default minimum interval between swaps
        this.weth.address, // tokenSpent
        this.fei.address, // tokenReceived
        userAddress, // tokenReceivingAddress
        '100'+e18, // maxSpentPerSwap
        '300', // maximumSlippageBasisPoints
        false, // invertOraclePrice
        '200'+e18 // swap incentive = 200 FEI
      );

      await this.core.grantPCVController(pcvControllerAddress, {from: governorAddress});
    });

    describe('Payable', function() {
      it('should mint WETH on ETH reception', async function() {
        // send 23 ETH
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '23'+e18});
        const wethBalance = await this.weth.balanceOf(this.swapper.address);
        expect(wethBalance).to.be.bignumber.equal('23'+e18);
      });
    });

    describe('IPCVSwapper interface override', function() {
      describe('Getters', function() {
        it('getTokenSpent()', async function() {
          expect(await this.swapper.getTokenSpent()).to.equal(this.weth.address);
        });
        it('getTokenReceived()', async function() {
          expect(await this.swapper.getTokenReceived()).to.equal(this.fei.address);
        });
        it('getReceivingAddress()', async function() {
          expect(await this.swapper.getReceivingAddress()).to.equal(userAddress);
        });
      });
      describe('Setters', function() {
        describe('As Governor', function() {
          it('setTokenSpent() emit UpdateTokenSpent', async function() {
            await expectEvent(
              await this.swapper.setTokenSpent('0x6B175474E89094C44Da98b954EedeAC495271d0F', {from: governorAddress}),
              'UpdateTokenSpent',
              { _tokenFrom: '0x6B175474E89094C44Da98b954EedeAC495271d0F' }
            );
          });
          it('setTokenReceived() emit UpdateTokenReceived', async function() {
            await expectEvent(
              await this.swapper.setTokenReceived('0x6B175474E89094C44Da98b954EedeAC495271d0F', {from: governorAddress}),
              'UpdateTokenReceived',
              { _tokenTo: '0x6B175474E89094C44Da98b954EedeAC495271d0F' }
            );
          });
          it('setReceivingAddress() emit UpdateReceivingAddress', async function() {
            await expectEvent(
              await this.swapper.setReceivingAddress(userAddress, {from: governorAddress}),
              'UpdateReceivingAddress',
              { _tokenReceivingAddress: userAddress }
            );
          });
        });
        describe('As Anyone', function() {
          it('revert setTokenSpent() onlyGovernor', async function() {
            await expectRevert(
              this.swapper.setTokenSpent('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
              'CoreRef: Caller is not a governor.'
            );
          });
          it('revert setTokenReceived() onlyGovernor', async function() {
            await expectRevert(
              this.swapper.setTokenReceived('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
              'CoreRef: Caller is not a governor.'
            );
          });
          it('revert setReceivingAddress() onlyGovernor', async function() {
            await expectRevert(
              this.swapper.setReceivingAddress(userAddress),
              'CoreRef: Caller is not a governor.'
            );
          });
        });
      });
      describe('Withdraw', function() {
        describe('As PCVController', function() {
          it('revert withdrawETH() insufficient balance (all ETH is wrapped)', async function() {
            // send 1 ETH, gets converted to 1 WETH
            await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '1'+e18});
            await expectRevert(
              this.swapper.withdrawETH(userAddress, 1, {from: pcvControllerAddress}),
              'Address: insufficient balance'
            );
          });
          it('withdrawERC20() emit WithdrawERC20', async function() {
            expect(await this.fei.balanceOf(this.swapper.address)).to.be.bignumber.equal('0');
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal('0');
            await this.fei.mint(this.swapper.address, '1'+e18, {from: minterAddress});
            expect(await this.fei.balanceOf(this.swapper.address)).to.be.bignumber.equal('1'+e18);
            await expectEvent(
              await this.swapper.withdrawERC20(userAddress, this.fei.address, '1'+e18, {from: pcvControllerAddress}),
              'WithdrawERC20',
              {
                _caller: pcvControllerAddress,
                _to: userAddress,
                _token: this.fei.address,
                _amount: '1'+e18
              }
            );
            expect(await this.fei.balanceOf(this.swapper.address)).to.be.bignumber.equal('0');
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal('1'+e18);
          });
        });
        describe('As Anyone', function() {
          it('revert withdrawETH() onlyPCVController', async function() {
            await expectRevert(
              this.swapper.withdrawETH(userAddress, 1),
              'CoreRef: Caller is not a PCV controller.'
            );
          });
          it('revert withdrawERC20() onlyPCVController', async function() {
            await expectRevert(
              this.swapper.withdrawERC20(userAddress, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 1),
              'CoreRef: Caller is not a PCV controller.'
            );
          });
        });
      });
      describe('Swap', function() {
        it('swap() emit Swap', async function() {
          await time.increase('1000');
          await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '100'+e18});
          await expectEvent(
            await this.swapper.swap({from: userAddress}),
            'Swap',
            {
              _caller: userAddress,
              _tokenSpent: this.weth.address,
              _tokenReceived: this.fei.address,
              _amountSpent: '100'+e18,
              _amountReceived: '248259939361825041733566' // not exactly 250000e18 because of slippage & fees
            }
          );
        });
      });
    });

    describe('Getters', function() {
      it('getOraclePrice()', async function() {
        expect(await this.swapper.getOraclePrice()).to.be.bignumber.equal('2500');
      });
      it('getNextAmountSpent()', async function() {
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '100'+e18});
        expect(await this.swapper.getNextAmountSpent()).to.be.bignumber.equal('100000000000000000000'); // 100e18
      });
      it('getNextAmountReceived()', async function() {
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '100'+e18});
        expect(await this.swapper.getNextAmountReceived()).to.be.bignumber.equal('248259939361825041733566');
      });
      it('getNextAmountReceivedThreshold()', async function() {
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '100'+e18});
        expect(await this.swapper.getNextAmountReceivedThreshold()).to.be.bignumber.equal('242500000000000000000000');
      });
      it('getDecimalNormalizer()', async function() {
        const decimalNormalizer = await this.swapper.getDecimalNormalizer();
        expect(decimalNormalizer[0]).to.be.bignumber.equal('1');
        expect(decimalNormalizer[1]).to.be.equal(true);
      });
    });

    describe('Setters', function() {
      it('setMaximumSlippage() revert if not governor', async function() {
        await expectRevert(
          this.swapper.setMaximumSlippage('500'),
          'CoreRef: Caller is not a governor.'
        );
      });
      it('setMaximumSlippage() revert on invalid value', async function() {
        await expectRevert(
          this.swapper.setMaximumSlippage('10001', { from: governorAddress }),
          'PCVSwapperUniswap: Exceeds bp granularity.'
        );
      });
      it('setMaximumSlippage()', async function() {
        expect(await this.swapper.maximumSlippageBasisPoints()).to.be.bignumber.equal('300');
        await this.swapper.setMaximumSlippage('500', { from: governorAddress });
        expect(await this.swapper.maximumSlippageBasisPoints()).to.be.bignumber.equal('500');
      });
      it('setMaxSpentPerSwap() revert if not governor', async function() {
        await expectRevert(
          this.swapper.setMaxSpentPerSwap('0'),
          'CoreRef: Caller is not a governor.'
        );
      });
      it('setMaxSpentPerSwap() revert on invalid value', async function() {
        await expectRevert(
          this.swapper.setMaxSpentPerSwap('0', { from: governorAddress }),
          'PCVSwapperUniswap: Cannot swap 0.'
        );
      });
      it('setMaxSpentPerSwap()', async function() {
        expect(await this.swapper.maxSpentPerSwap()).to.be.bignumber.equal('100'+e18);
        await this.swapper.setMaxSpentPerSwap('50'+e18, { from: governorAddress });
        expect(await this.swapper.maxSpentPerSwap()).to.be.bignumber.equal('50'+e18);
      });
      it('setTokenBuyLimit() revert if not governor', async function() {
        await expectRevert(
          this.swapper.setTokenBuyLimit('500000'+e18),
          'CoreRef: Caller is not a governor.'
        );
      });
      it('setTokenBuyLimit()', async function() {
        expect(await this.swapper.tokenBuyLimit()).to.be.bignumber.equal('0');
        await this.swapper.setTokenBuyLimit('500000'+e18, { from: governorAddress });
        expect(await this.swapper.tokenBuyLimit()).to.be.bignumber.equal('500000'+e18);
      });
      it('setSwapFrequency() revert if not governor', async function() {
        await expectRevert(
          this.swapper.setSwapFrequency('2000'),
          'CoreRef: Caller is not a governor.'
        );
      });
      it('setSwapFrequency()', async function() {
        expect(await this.swapper.getSwapFrequency()).to.be.bignumber.equal('1000');
        await this.swapper.setSwapFrequency('2000', { from: governorAddress });
        expect(await this.swapper.getSwapFrequency()).to.be.bignumber.equal('2000');
      });
      it('setInvertOraclePrice() revert if not governor', async function() {
        await expectRevert(
          this.swapper.setInvertOraclePrice(true),
          'CoreRef: Caller is not a governor.'
        );
      });
      it('setInvertOraclePrice()', async function() {
        expect(await this.swapper.invertOraclePrice()).to.be.equal(false);
        await this.swapper.setInvertOraclePrice(true, {from: governorAddress})
        expect(await this.swapper.invertOraclePrice()).to.be.equal(true);
      });
    });

    describe('Swap', function() {
      it('revert if paused by guardian', async function() {
        await time.increase('1000');
        await this.swapper.pause({from: guardianAddress});
        await expectRevert(this.swapper.swap(), 'Pausable: paused');
      });
      it('revert if paused by governor', async function() {
        await time.increase('1000');
        await this.swapper.pause({from: governorAddress});
        await expectRevert(this.swapper.swap(), 'Pausable: paused');
      });
      it('revert if time is not elapsed', async function() {
        await expectRevert(this.swapper.swap(), 'Timed: time not ended.');
      });
      it('revert if buy limit is exceeded', async function() {
        await time.increase('1000');
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '50'+e18});
        await this.swapper.setTokenBuyLimit('1', {from: governorAddress});
        // first swap is successful but pushes the target's balance above limit
        await this.swapper.swap({from: userAddress});
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal('124376992277398866659880');
        await time.increase('1000');
        // second swap fails because the target's balance is above limit
        await expectRevert(this.swapper.swap(), 'PCVSwapperUniswap: tokenBuyLimit reached.');
      });
      it('revert if oracle is invalid', async function() {
        await this.oracle.setValid(false);
        await time.increase('1000');
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '100'+e18});
        await expectRevert(this.swapper.swap(), 'OracleRef: oracle invalid.');
      });
      it('revert if slippage is too high', async function() {
        await time.increase('1000');
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '1000'+e18});
        await this.swapper.setMaxSpentPerSwap('1000'+e18, {from: governorAddress});
        await expectRevert(this.swapper.swap(), 'PCVSwapperUniswap: slippage too high.');
      });
      it('send tokens to tokenReceivingAddress', async function() {
        await time.increase('1000');
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '100'+e18});
        await this.swapper.swap({from: userAddress});
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal('248259939361825041733566');
      });
      it('swap remaining tokens if balance < maxSpentPerSwap', async function() {
        await time.increase('1000');
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '50'+e18});
        await this.swapper.swap({from: userAddress});
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal('124376992277398866659880');
      });
      it('no FEI incentive to caller if swapper is not a Minter', async function() {
        await time.increase('1000');
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '50'+e18});
        expect((await this.fei.balanceOf(secondUserAddress)) / 1e18).to.be.equal(0);
        await this.swapper.swap({from: secondUserAddress});
        expect((await this.fei.balanceOf(secondUserAddress)) / 1e18).to.be.equal(0);
      });
      it('send FEI incentive to caller if swapper is Minter', async function() {
        await time.increase('1000');
        await web3.eth.sendTransaction({from: userAddress, to: this.swapper.address, value: '50'+e18});
        await this.core.grantMinter(this.swapper.address, {from: governorAddress});
        expect((await this.fei.balanceOf(secondUserAddress)) / 1e18).to.be.equal(0);
        await this.swapper.swap({from: secondUserAddress});
        expect((await this.fei.balanceOf(secondUserAddress)) / 1e18).to.be.equal(200);
      });
    });
  });