import { expectRevert, expectApprox, getAddresses, getCore, getImpersonatedSigner } from '@test/helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

const toBN = ethers.BigNumber.from;

describe('AngleUniswapPCVDeposit', function () {
  const LIQUIDITY_INCREMENT = 10000; // amount of liquidity created by mock for each deposit
  let userAddress: string;
  let governorAddress: string;
  let minterAddress: string;
  let beneficiaryAddress1: string;
  let pcvControllerAddress: string;

  beforeEach(async function () {
    ({ userAddress, governorAddress, minterAddress, beneficiaryAddress1, pcvControllerAddress } = await getAddresses());
    this.core = await getCore();

    this.fei = await ethers.getContractAt('Fei', await this.core.fei());
    this.angle = await (await ethers.getContractFactory('MockERC20')).deploy();
    this.agEUR = await (await ethers.getContractFactory('MockERC20')).deploy();
    this.weth = await (await ethers.getContractFactory('MockWeth')).deploy();

    this.pair = await (
      await ethers.getContractFactory('MockUniswapV2PairLiquidity')
    ).deploy(this.fei.address, this.agEUR.address);
    this.oracle = await (await ethers.getContractFactory('MockOracle')).deploy(2); // 2:1 oracle price
    this.router = await (await ethers.getContractFactory('MockRouter')).deploy(this.pair.address);
    this.router.setWETH(this.weth.address);

    // Mock Angle Contracts
    this.stableMaster = await (await ethers.getContractFactory('MockAngleStableMaster')).deploy(this.agEUR.address, 2); // 2:1 oracle price
    this.poolManager = await (await ethers.getContractFactory('MockAnglePoolManager')).deploy(this.fei.address);
    this.stakingRewards = await (
      await ethers.getContractFactory('MockAngleStakingRewards')
    ).deploy(this.pair.address, this.angle.address);

    this.pcvDeposit = await (
      await ethers.getContractFactory('AngleUniswapPCVDeposit')
    ).deploy(
      this.core.address,
      this.pair.address,
      this.router.address,
      this.oracle.address,
      this.oracle.address,
      '100',
      this.stableMaster.address,
      this.poolManager.address,
      this.stakingRewards.address
    );

    await this.core.connect(await getImpersonatedSigner(governorAddress)).grantMinter(this.pcvDeposit.address);

    await this.pair.connect(await getImpersonatedSigner(userAddress)).set(200000, 100000, LIQUIDITY_INCREMENT); // 2:1 FEI/agEUR with 10k liquidity

    await this.fei.connect(await getImpersonatedSigner(minterAddress)).mint(this.pair.address, 200000);
    await this.agEUR.mint(this.pair.address, 100000);
  });

  describe('Resistant Balance', function () {
    it('succeeds', async function () {
      await this.pair
        .connect(await getImpersonatedSigner(userAddress))
        .transfer(this.pcvDeposit.address, LIQUIDITY_INCREMENT);
      const resistantBalances = await this.pcvDeposit.resistantBalanceAndFei();

      // Resistant balances should multiply to k and have price of 400
      // PCV deposit owns half of the LP
      expect(resistantBalances[0]).to.be.equal(toBN(100000));
      expect(resistantBalances[1]).to.be.equal(toBN(200000));
      expectApprox(resistantBalances[0].mul(resistantBalances[1]), '20000000000');
      expectApprox(resistantBalances[1].div(resistantBalances[0]), '2');
    });
  });

  describe('Deposit', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.pcvDeposit.connect(await getImpersonatedSigner(governorAddress)).pause();
        await this.agEUR.mint(this.pcvDeposit.address, 100000);
        await expectRevert(
          this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).deposit(),
          'Pausable: paused'
        );
      });
    });

    describe('Pre deposit values', function () {
      it('liquidityOwned', async function () {
        expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(0));
      });

      it('pair reserves', async function () {
        expect(await this.agEUR.balanceOf(this.pair.address)).to.be.equal(toBN(100000));
        expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(200000));
        const result = await this.pcvDeposit.getReserves();
        expect(result[0]).to.be.equal(toBN(200000));
        expect(result[1]).to.be.equal(toBN(100000));
      });
      it('balance', async function () {
        expect(await this.pcvDeposit.balance()).to.be.equal(toBN(0));
      });
    });

    describe('Post deposit values', function () {
      beforeEach(async function () {
        await this.agEUR.mint(this.pcvDeposit.address, 100000);
        await this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).deposit();
      });

      describe('No existing liquidity', function () {
        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(LIQUIDITY_INCREMENT));
          expect(await this.stakingRewards.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(LIQUIDITY_INCREMENT));
        });

        it('pair reserves', async function () {
          expect(await this.agEUR.balanceOf(this.pair.address)).to.be.equal(toBN(200000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(400000)); // deposits at oracle price
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(400000));
          expect(result[1]).to.be.equal(toBN(200000));
        });

        it('balance', async function () {
          expect(await this.pcvDeposit.balance()).to.be.equal(toBN(100000));
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });

        it('no token held', async function () {
          expect(await this.agEUR.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });
      });

      describe('With existing liquidity', function () {
        beforeEach(async function () {
          await this.agEUR.mint(this.pcvDeposit.address, 100000);
          await this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).deposit();
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(2 * LIQUIDITY_INCREMENT));
          expect(await this.stakingRewards.balanceOf(this.pcvDeposit.address)).to.be.equal(
            toBN(2 * LIQUIDITY_INCREMENT)
          );
        });

        it('pair reserves', async function () {
          expect(await this.agEUR.balanceOf(this.pair.address)).to.be.equal(toBN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(600000)); // deposits at oracle price
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(600000));
          expect(result[1]).to.be.equal(toBN(300000));
        });

        it('balance', async function () {
          expect(await this.pcvDeposit.balance()).to.be.equal(toBN(199999)); // rounding error
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });

        it('no agEUR held', async function () {
          expect(await this.agEUR.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });
      });

      describe('Pool price changes under threshold', function () {
        it('reverts', async function () {
          await this.router.setAmountMin(195000);
          await this.agEUR.mint(this.pcvDeposit.address, 100000);
          await expectRevert(
            this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).deposit(),
            'amount liquidity revert'
          );
        });

        describe('after threshold update', function () {
          beforeEach(async function () {
            await this.router.setAmountMin(195000);
            await this.pcvDeposit.connect(await getImpersonatedSigner(governorAddress)).setMaxBasisPointsFromPegLP(300);
            await this.agEUR.mint(this.pcvDeposit.address, 100000);
            await this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).deposit();
          });

          it('liquidityOwned', async function () {
            expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(2 * LIQUIDITY_INCREMENT));
            expect(await this.stakingRewards.balanceOf(this.pcvDeposit.address)).to.be.equal(
              toBN(2 * LIQUIDITY_INCREMENT)
            );
          });

          it('pair reserves', async function () {
            expect(await this.agEUR.balanceOf(this.pair.address)).to.be.equal(toBN(300000));
            expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(600000)); // deposits at oracle price
            const result = await this.pcvDeposit.getReserves();
            expect(result[0]).to.be.equal(toBN(600000));
            expect(result[1]).to.be.equal(toBN(300000));
          });

          it('balance', async function () {
            expect(await this.pcvDeposit.balance()).to.be.equal(toBN(199999)); // rounding error
          });

          it('no fei held', async function () {
            expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
          });

          it('no agEUR held', async function () {
            expect(await this.agEUR.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
          });
        });
      });

      describe('Pool price changes over threshold', function () {
        beforeEach(async function () {
          await this.router.setAmountMin(41000000);
          await this.agEUR.mint(this.pcvDeposit.address, 100000);
          await this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).deposit();
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(2 * LIQUIDITY_INCREMENT));
          expect(await this.stakingRewards.balanceOf(this.pcvDeposit.address)).to.be.equal(
            toBN(2 * LIQUIDITY_INCREMENT)
          );
        });

        it('pair reserves', async function () {
          expect(await this.agEUR.balanceOf(this.pair.address)).to.be.equal(toBN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(600000)); // deposits at oracle price
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(600000));
          expect(result[1]).to.be.equal(toBN(300000));
        });

        it('balance', async function () {
          expect(await this.pcvDeposit.balance()).to.be.equal(toBN(199999)); // rounding error
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });

        it('no agEUR held', async function () {
          expect(await this.agEUR.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });
      });

      describe('Burns FEI', function () {
        beforeEach(async function () {
          await this.agEUR.mint(this.pcvDeposit.address, '200000');
          await this.fei.connect(await getImpersonatedSigner(minterAddress)).mint(this.pcvDeposit.address, '1000');
          await this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).deposit();
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(2 * LIQUIDITY_INCREMENT));
          expect(await this.stakingRewards.balanceOf(this.pcvDeposit.address)).to.be.equal(
            toBN(2 * LIQUIDITY_INCREMENT)
          );
        });

        it('pair reserves', async function () {
          expect(await this.agEUR.balanceOf(this.pair.address)).to.be.equal(toBN(400000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(800000)); // deposits at oracle price
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(800000));
          expect(result[1]).to.be.equal(toBN(400000));
        });

        it('balance', async function () {
          expect(await this.pcvDeposit.balance()).to.be.equal(toBN(266666)); // rounding error
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });

        it('no agEUR held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });
      });

      describe('After oracle price move', function () {
        beforeEach(async function () {
          await this.oracle.setExchangeRate(3); // 3:1 oracle price
          // Then deposit
          await this.agEUR.mint(this.pcvDeposit.address, '100000');
          await this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).deposit();
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(2 * LIQUIDITY_INCREMENT));
          expect(await this.stakingRewards.balanceOf(this.pcvDeposit.address)).to.be.equal(
            toBN(2 * LIQUIDITY_INCREMENT)
          );
        });

        it('pair reserves', async function () {
          expect(await this.agEUR.balanceOf(this.pair.address)).to.be.equal(toBN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(700000));
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(700000));
          expect(result[1]).to.be.equal(toBN(300000));
        });

        it('balance', async function () {
          expect(await this.pcvDeposit.balance()).to.be.equal(toBN(199999)); // rounding error
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });

        it('no agEUR held', async function () {
          expect(await this.agEUR.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });
      });
    });
  });

  describe('Withdraw', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.pcvDeposit.connect(await getImpersonatedSigner(governorAddress)).pause();
        await expectRevert(
          this.pcvDeposit
            .connect(await getImpersonatedSigner(pcvControllerAddress))
            .withdraw(beneficiaryAddress1, '100000'),
          'Pausable: paused'
        );
      });
    });

    describe('Reverts', function () {
      it('not pcv controller', async function () {
        await expectRevert(
          this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).withdraw(beneficiaryAddress1, '100000'),
          'CoreRef: Caller is not a PCV controller'
        );
      });

      it('no balance', async function () {
        await this.core.connect(await getImpersonatedSigner(governorAddress)).grantPCVController(userAddress);
        await expectRevert(
          this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).withdraw(beneficiaryAddress1, '100000'),
          'UniswapPCVDeposit: Insufficient underlying'
        );
      });
    });
    describe('With Balance', function () {
      beforeEach(async function () {
        await this.agEUR.mint(this.pcvDeposit.address, '100000');
        await this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).deposit();
        this.beneficiaryBalance = await this.agEUR.balanceOf(beneficiaryAddress1);
      });

      it('liquidityOwned', async function () {
        expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(LIQUIDITY_INCREMENT));
        expect(await this.stakingRewards.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(LIQUIDITY_INCREMENT));
      });

      it('balance', async function () {
        expect(await this.pcvDeposit.balance()).to.be.equal(toBN(100000));
      });

      describe('Partial', function () {
        beforeEach(async function () {
          await expect(
            await this.pcvDeposit
              .connect(await getImpersonatedSigner(pcvControllerAddress))
              .withdraw(beneficiaryAddress1, '50000')
          )
            .to.emit(this.pcvDeposit, 'Withdrawal')
            .withArgs(pcvControllerAddress, beneficiaryAddress1, '50000');
        });

        it('user balance updates', async function () {
          expect(await this.agEUR.balanceOf(beneficiaryAddress1)).to.be.equal(toBN(50000).add(this.beneficiaryBalance));
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });

        it('pair balances update', async function () {
          expect(await this.agEUR.balanceOf(this.pair.address)).to.be.equal(toBN(150000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(300000));
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(300000));
          expect(result[1]).to.be.equal(toBN(150000));
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(LIQUIDITY_INCREMENT / 2));
        });
      });

      describe('Total', function () {
        beforeEach(async function () {
          await this.pcvDeposit
            .connect(await getImpersonatedSigner(pcvControllerAddress))
            .withdraw(beneficiaryAddress1, '100000');
        });

        it('user balance updates', async function () {
          expect(await this.agEUR.balanceOf(beneficiaryAddress1)).to.be.equal(
            toBN(100000).add(this.beneficiaryBalance)
          );
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(0));
        });

        it('pair balances update', async function () {
          expect(await this.agEUR.balanceOf(this.pair.address)).to.be.equal(toBN(100000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(200000));
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(200000));
          expect(result[1]).to.be.equal(toBN(100000));
        });
      });
    });
  });

  describe('Access', function () {
    describe('setMaxBasisPointsFromPegLP', function () {
      it('Governor set succeeds', async function () {
        await expect(
          await this.pcvDeposit.connect(await getImpersonatedSigner(governorAddress)).setMaxBasisPointsFromPegLP(300)
        )
          .to.emit(this.pcvDeposit, 'MaxBasisPointsFromPegLPUpdate')
          .withArgs('100', '300');

        expect(await this.pcvDeposit.maxBasisPointsFromPegLP()).to.be.equal('300');
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(
          this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).setMaxBasisPointsFromPegLP(300),
          'CoreRef: Caller is not a governor'
        );
      });

      it('over 100%', async function () {
        await expectRevert(
          this.pcvDeposit.connect(await getImpersonatedSigner(governorAddress)).setMaxBasisPointsFromPegLP(10001),
          'UniswapPCVDeposit: basis points from peg too high'
        );
      });
    });

    describe('withdrawERC20', function () {
      it('PCVController succeeds', async function () {
        this.agEUR.mint(this.pcvDeposit.address, toBN('1000'));
        await expect(
          await this.pcvDeposit
            .connect(await getImpersonatedSigner(pcvControllerAddress))
            .withdrawERC20(this.agEUR.address, userAddress, toBN('1000'))
        )
          .to.emit(this.pcvDeposit, 'WithdrawERC20')
          .withArgs(pcvControllerAddress, this.agEUR.address, userAddress, '1000');

        expect(await this.agEUR.balanceOf(userAddress)).to.be.equal('1000');
      });

      it('Non-PCVController fails', async function () {
        await expectRevert(
          this.pcvDeposit
            .connect(await getImpersonatedSigner(userAddress))
            .withdrawERC20(this.agEUR.address, userAddress, toBN('1000')),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('Pair', function () {
      it('Governor set succeeds', async function () {
        const pair2 = await (
          await ethers.getContractFactory('MockUniswapV2PairLiquidity')
        ).deploy(this.agEUR.address, this.fei.address);
        await expect(await this.pcvDeposit.connect(await getImpersonatedSigner(governorAddress)).setPair(pair2.address))
          .to.emit(this.pcvDeposit, 'PairUpdate')
          .withArgs(this.pair.address, pair2.address);

        expect(await this.pcvDeposit.pair()).to.be.equal(pair2.address);
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(
          this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).setPair(userAddress),
          'CoreRef: Caller is not a governor'
        );
      });
    });
  });

  describe('agToken minting', function () {
    it('minted agEUR with FEI', async function () {
      await this.pcvDeposit.connect(await getImpersonatedSigner(pcvControllerAddress)).mintAgToken('50000');
      expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN('0'));
      expect(await this.agEUR.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN('24925'));
    });

    it('should revert if fee/slippage is too high', async function () {
      await this.stableMaster.setFee(150); // set fee to 1.5%
      await expectRevert(
        this.pcvDeposit.connect(await getImpersonatedSigner(pcvControllerAddress)).mintAgToken('50000'),
        '15' // Angle use integer error code, this one is for slippage check
      );
    });

    it('should revert if not PCVController', async function () {
      await expectRevert(
        this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).mintAgToken('50000'),
        'CoreRef: Caller is not a PCV controller'
      );
    });
  });

  describe('agToken burning', function () {
    it('burn all agEUR for FEI', async function () {
      await this.agEUR.mint(this.pcvDeposit.address, '50000');
      await this.fei.connect(await getImpersonatedSigner(minterAddress)).mint(this.stableMaster.address, '100000');
      await this.pcvDeposit.connect(await getImpersonatedSigner(pcvControllerAddress)).burnAgTokenAll();
      expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN('0')); // not 99700, because burnt
      expect(await this.agEUR.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN('0'));
    });

    it('burn agEUR for FEI', async function () {
      await this.agEUR.mint(this.pcvDeposit.address, '50000');
      await this.fei.connect(await getImpersonatedSigner(minterAddress)).mint(this.stableMaster.address, '100000');
      await this.pcvDeposit.connect(await getImpersonatedSigner(pcvControllerAddress)).burnAgToken('25000');
      expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN('0')); // not 49850, because burnt
      expect(await this.fei.balanceOf(this.stableMaster.address)).to.be.equal(toBN('50150'));
      expect(await this.agEUR.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN('25000'));
    });

    it('should revert if fee/slippage is too high', async function () {
      await this.agEUR.mint(this.pcvDeposit.address, '50000');
      await this.fei.connect(await getImpersonatedSigner(minterAddress)).mint(this.stableMaster.address, '100000');
      await this.stableMaster.setFee(150); // set fee to 1.5%
      await expectRevert(
        this.pcvDeposit.connect(await getImpersonatedSigner(pcvControllerAddress)).burnAgTokenAll(),
        '15' // Angle use integer error code, this one is for slippage check
      );
    });

    it('should revert if not PCVController', async function () {
      await this.agEUR.mint(this.pcvDeposit.address, '50000');
      await this.fei.connect(await getImpersonatedSigner(minterAddress)).mint(this.stableMaster.address, '100000');
      await expectRevert(
        this.pcvDeposit.connect(await getImpersonatedSigner(userAddress)).burnAgTokenAll(),
        'CoreRef: Caller is not a PCV controller'
      );
    });
  });
});
