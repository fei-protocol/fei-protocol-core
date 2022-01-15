import { expectRevert, expectApprox, getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

describe('EthUniswapPCVDeposit', function () {
  const LIQUIDITY_INCREMENT = 10000; // amount of liquidity created by mock for each deposit
  let userAddress;
  let governorAddress;
  let minterAddress;
  let beneficiaryAddress1;
  let pcvControllerAddress;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

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
    ({ userAddress, governorAddress, minterAddress, beneficiaryAddress1, pcvControllerAddress } = await getAddresses());
    this.core = await getCore();

    this.fei = await ethers.getContractAt('Fei', await this.core.fei());
    this.weth = await (await ethers.getContractFactory('MockWeth')).deploy();
    this.pair = await (
      await ethers.getContractFactory('MockUniswapV2PairLiquidity')
    ).deploy(this.fei.address, this.weth.address);
    this.oracle = await (await ethers.getContractFactory('MockOracle')).deploy(400); // 400:1 oracle price
    this.router = await (await ethers.getContractFactory('MockRouter')).deploy(this.pair.address);
    this.router.setWETH(this.weth.address);
    this.pcvDeposit = await (
      await ethers.getContractFactory('UniswapPCVDeposit')
    ).deploy(
      this.core.address,
      this.pair.address,
      this.router.address,
      this.oracle.address,
      this.oracle.address,
      '100'
    );

    await this.core.connect(impersonatedSigners[governorAddress]).grantMinter(this.pcvDeposit.address, {});

    await this.pair
      .connect(impersonatedSigners[userAddress])
      .set(50000000, 100000, LIQUIDITY_INCREMENT, { value: 100000 }); // 500:1 FEI/ETH with 10k liquidity

    await this.fei.connect(impersonatedSigners[minterAddress]).mint(this.pair.address, 50000000, {});
    1;
    await this.weth.mint(this.pair.address, 100000);
  });

  describe('Resistant Balance', function () {
    it('succeeds', async function () {
      await this.pair
        .connect(impersonatedSigners[userAddress])
        .transfer(this.pcvDeposit.address, LIQUIDITY_INCREMENT, {});
      const resistantBalances = await this.pcvDeposit.resistantBalanceAndFei();

      // Resistant balances should multiply to k and have price of 400
      // PCV deposit owns half of the LP
      expect(resistantBalances[0]).to.be.equal(toBN(111803));
      expect(resistantBalances[1]).to.be.equal(toBN(44721519));
      expectApprox(resistantBalances[0].mul(resistantBalances[1]), '5000000000000');
      expectApprox(resistantBalances[1].div(resistantBalances[0]), '400', '10');
    });
  });

  describe('Deposit', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).pause({});
        await impersonatedSigners[userAddress].sendTransaction({
          from: userAddress,
          to: this.pcvDeposit.address,
          value: 100000
        });
        await expectRevert(this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({}), 'Pausable: paused');
      });
    });

    describe('Pre deposit values', function () {
      it('liquidityOwned', async function () {
        expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(0));
      });

      it('pair reserves', async function () {
        expect(await this.weth.balanceOf(this.pair.address)).to.be.equal(toBN(100000));
        expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(50000000));
        const result = await this.pcvDeposit.getReserves();
        expect(result[0]).to.be.equal(toBN(50000000));
        expect(result[1]).to.be.equal(toBN(100000));
      });
      it('balance', async function () {
        expect(await this.pcvDeposit.balance()).to.be.equal(toBN(0));
      });
    });

    describe('Post deposit values', function () {
      beforeEach(async function () {
        await impersonatedSigners[userAddress].sendTransaction({
          from: userAddress,
          to: this.pcvDeposit.address,
          value: 100000
        });
        await this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({});
      });

      describe('No existing liquidity', function () {
        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(LIQUIDITY_INCREMENT));
        });

        it('pair reserves', async function () {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.equal(toBN(200000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(90000000)); // deposits at oracle price
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(90000000));
          expect(result[1]).to.be.equal(toBN(200000));
        });

        it('balance', async function () {
          expect(await this.pcvDeposit.balance()).to.be.equal(toBN(100000));
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });
      });
      describe('With existing liquidity', function () {
        beforeEach(async function () {
          await impersonatedSigners[userAddress].sendTransaction({
            from: userAddress,
            to: this.pcvDeposit.address,
            value: 100000
          });
          await this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({});
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function () {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.equal(toBN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(130000000)); // deposits at oracle price
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(130000000));
          expect(result[1]).to.be.equal(toBN(300000));
        });

        it('balance', async function () {
          expect(await this.pcvDeposit.balance()).to.be.equal(toBN(199999)); // rounding error
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });
      });

      describe('Pool price changes under threshold', function () {
        it('reverts', async function () {
          await this.router.setAmountMin(39000000);
          await impersonatedSigners[userAddress].sendTransaction({
            from: userAddress,
            to: this.pcvDeposit.address,
            value: 100000
          });
          await expectRevert(
            this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({}),
            'amount liquidity revert'
          );
        });

        describe('after threshold update', function () {
          beforeEach(async function () {
            await this.router.setAmountMin(39000000);
            await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxBasisPointsFromPegLP(300, {});
            await impersonatedSigners[userAddress].sendTransaction({
              from: userAddress,
              to: this.pcvDeposit.address,
              value: 100000
            });
            await this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({});
          });

          it('liquidityOwned', async function () {
            expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(LIQUIDITY_INCREMENT * 2));
          });

          it('pair reserves', async function () {
            expect(await this.weth.balanceOf(this.pair.address)).to.be.equal(toBN(300000));
            expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(130000000)); // deposits at oracle price
            const result = await this.pcvDeposit.getReserves();
            expect(result[0]).to.be.equal(toBN(130000000));
            expect(result[1]).to.be.equal(toBN(300000));
          });

          it('balance', async function () {
            expect(await this.pcvDeposit.balance()).to.be.equal(toBN(199999)); // rounding error
          });

          it('no fei held', async function () {
            expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
          });
        });
      });

      describe('Pool price changes over threshold', function () {
        beforeEach(async function () {
          await this.router.setAmountMin(41000000);
          await impersonatedSigners[userAddress].sendTransaction({
            from: userAddress,
            to: this.pcvDeposit.address,
            value: toBN(100000)
          });
          await this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({});
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function () {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.equal(toBN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(130000000)); // deposits at oracle price
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(130000000));
          expect(result[1]).to.be.equal(toBN(300000));
        });

        it('balance', async function () {
          expect(await this.pcvDeposit.balance()).to.be.equal(toBN(199999)); // rounding error
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });
      });

      describe('Transfers held ETH and burns FEI', function () {
        beforeEach(async function () {
          await this.weth.mint(this.pcvDeposit.address, '100000');
          await impersonatedSigners[userAddress].sendTransaction({
            from: userAddress,
            to: this.pcvDeposit.address,
            value: 100000
          });
          await this.fei.connect(impersonatedSigners[minterAddress]).mint(this.pcvDeposit.address, '1000', {});
          await this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({});
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function () {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.equal(toBN(400000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(170000000)); // deposits at oracle price
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(170000000));
          expect(result[1]).to.be.equal(toBN(400000));
        });

        it('balance', async function () {
          expect(await this.pcvDeposit.balance()).to.be.equal(toBN(266666)); // rounding error
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });
      });

      describe('After oracle price move', function () {
        beforeEach(async function () {
          await this.oracle.setExchangeRate(600); // 600:1 oracle price
          // Then deposit
          await impersonatedSigners[userAddress].sendTransaction({
            from: userAddress,
            to: this.pcvDeposit.address,
            value: 100000
          });
          await this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({});
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function () {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.equal(toBN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(150000000));
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(150000000));
          expect(result[1]).to.be.equal(toBN(300000));
        });

        it('balance', async function () {
          expect(await this.pcvDeposit.balance()).to.be.equal(toBN(199999)); // rounding error
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });
      });
    });
  });

  describe('Withdraw', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(
          this.pcvDeposit
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdraw(beneficiaryAddress1, '100000', {}),
          'Pausable: paused'
        );
      });
    });

    describe('Reverts', function () {
      it('not pcv controller', async function () {
        await expectRevert(
          this.pcvDeposit.connect(impersonatedSigners[userAddress]).withdraw(beneficiaryAddress1, '100000', {}),
          'CoreRef: Caller is not a PCV controller'
        );
      });

      it('no balance', async function () {
        await this.core.connect(impersonatedSigners[governorAddress]).grantPCVController(userAddress, {});
        await expectRevert(
          this.pcvDeposit.connect(impersonatedSigners[userAddress]).withdraw(beneficiaryAddress1, '100000', {}),
          'UniswapPCVDeposit: Insufficient underlying'
        );
      });
    });
    describe('With Balance', function () {
      beforeEach(async function () {
        await impersonatedSigners[userAddress].sendTransaction({
          from: userAddress,
          to: this.pcvDeposit.address,
          value: 100000
        });
        await this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({});
        this.beneficiaryBalance = await this.weth.balanceOf(beneficiaryAddress1);
      });

      describe('Partial', function () {
        beforeEach(async function () {
          await expect(
            await this.pcvDeposit
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdraw(beneficiaryAddress1, '50000')
          )
            .to.emit(this.pcvDeposit, 'Withdrawal')
            .withArgs(pcvControllerAddress, beneficiaryAddress1, '50000');
        });

        it('user balance updates', async function () {
          expect(await this.weth.balanceOf(beneficiaryAddress1)).to.be.equal(toBN(50000).add(this.beneficiaryBalance));
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });

        it('pair balances update', async function () {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.equal(toBN(150000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(67500000));
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(67500000));
          expect(result[1]).to.be.equal(toBN(150000));
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(LIQUIDITY_INCREMENT / 2));
        });
      });

      describe('Total', function () {
        beforeEach(async function () {
          await this.pcvDeposit
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdraw(beneficiaryAddress1, '100000', {});
        });

        it('user balance updates', async function () {
          expect(await this.weth.balanceOf(beneficiaryAddress1)).to.be.equal(toBN(100000).add(this.beneficiaryBalance));
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(toBN(0));
        });

        it('liquidityOwned', async function () {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.equal(toBN(0));
        });

        it('pair balances update', async function () {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.equal(toBN(100000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.equal(toBN(45000000));
          const result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.equal(toBN(45000000));
          expect(result[1]).to.be.equal(toBN(100000));
        });
      });
    });
  });

  describe('Access', function () {
    describe('setMaxBasisPointsFromPegLP', function () {
      it('Governor set succeeds', async function () {
        await expect(
          await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxBasisPointsFromPegLP(300)
        )
          .to.emit(this.pcvDeposit, 'MaxBasisPointsFromPegLPUpdate')
          .withArgs('100', '300');

        expect(await this.pcvDeposit.maxBasisPointsFromPegLP()).to.be.equal('300');
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(
          this.pcvDeposit.connect(impersonatedSigners[userAddress]).setMaxBasisPointsFromPegLP(300, {}),
          'CoreRef: Caller is not a governor'
        );
      });

      it('over 100%', async function () {
        await expectRevert(
          this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxBasisPointsFromPegLP(10001, {}),
          'UniswapPCVDeposit: basis points from peg too high'
        );
      });
    });

    describe('withdrawERC20', function () {
      it('PCVController succeeds', async function () {
        this.weth.mint(this.pcvDeposit.address, toBN('1000'));
        await expect(
          await this.pcvDeposit
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawERC20(this.weth.address, userAddress, toBN('1000'))
        )
          .to.emit(this.pcvDeposit, 'WithdrawERC20')
          .withArgs(pcvControllerAddress, this.weth.address, userAddress, '1000');

        expect(await this.weth.balanceOf(userAddress)).to.be.equal('1000');
      });

      it('Non-PCVController fails', async function () {
        await expectRevert(
          this.pcvDeposit
            .connect(impersonatedSigners[userAddress])
            .withdrawERC20(this.weth.address, userAddress, toBN('1000'), {}),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('Pair', function () {
      it('Governor set succeeds', async function () {
        const pair2 = await (
          await ethers.getContractFactory('MockUniswapV2PairLiquidity')
        ).deploy(this.weth.address, this.fei.address);
        await expect(await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setPair(pair2.address))
          .to.emit(this.pcvDeposit, 'PairUpdate')
          .withArgs(this.pair.address, pair2.address);

        expect(await this.pcvDeposit.pair()).to.be.equal(pair2.address);
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(
          this.pcvDeposit.connect(impersonatedSigners[userAddress]).setPair(userAddress, {}),
          'CoreRef: Caller is not a governor'
        );
      });
    });
  });
});
