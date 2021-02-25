

const {
  userAddress, 
  governorAddress, 
  minterAddress, 
  beneficiaryAddress1,
  pcvControllerAddress,
  web3,
  BN,
  expectEvent,
  expectRevert,
  balance,
  expect,
  EthUniswapPCVDeposit,
  Fei,
  MockERC20,
  MockOracle,
  MockPair,
  MockRouter,
  getCore
} = require('../helpers');

describe('EthUniswapPCVDeposit', function () {
  const LIQUIDITY_INCREMENT = 10000; // amount of liquidity created by mock for each deposit

  beforeEach(async function () {
    this.core = await getCore(true);

    this.fei = await Fei.at(await this.core.fei());
    this.token = await MockERC20.new();
    this.pair = await MockPair.new(this.token.address, this.fei.address);
    this.oracle = await MockOracle.new(400); // 400:1 oracle price
    this.router = await MockRouter.new(this.pair.address);
    this.pcvDeposit = await EthUniswapPCVDeposit.new(this.core.address, this.pair.address, this.router.address, this.oracle.address);
    await this.core.grantMinter(this.pcvDeposit.address, {from: governorAddress});

    await this.pair.set(100000, 50000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 500:1 FEI/ETH with 10k liquidity
  });

  describe('Deposit', function() {
    describe('Paused', function() {
      it('reverts', async function() {
        await this.pcvDeposit.pause({from: governorAddress});
        await expectRevert(this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"}), "Pausable: paused");
      });
    });
    describe('No prior LP', function() {
      beforeEach(async function() {
        await this.pair.setReserves(0, 0);
        this.pairEth = await balance.current(this.pair.address);
        this.pairFei = await this.fei.balanceOf(this.pair.address);
        expectEvent(
          await this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"}),
          'Deposit',
          {
            _from: userAddress,
            _amount: "100000"
          }
        );
      });

      it('deposits at oracle price', async function() {
        expect(await balance.current(this.pair.address)).to.be.bignumber.equal(this.pairEth.add(new BN("100000")));
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairFei.add(new BN("100000").mul(new BN(400))));
        let result = await this.pcvDeposit.getReserves();
        expect(result[0]).to.be.bignumber.equal(new BN(40000000));
        expect(result[1]).to.be.bignumber.equal(new BN(100000));
      });
    });

    describe('Pre deposit values', function() {
      it('liquidityOwned', async function(){
        expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(0));
      });

      it('pair reserves', async function() {
        expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(100000));
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(0));
        let result = await this.pcvDeposit.getReserves();
        expect(result[0]).to.be.bignumber.equal(new BN(50000000));
        expect(result[1]).to.be.bignumber.equal(new BN(100000));
      });
      it('totalValue', async function(){
        expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(0));
      });
    });
    describe('Post deposit values', function() {
      beforeEach(async function() {
        await this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"});
      });

      describe('No existing liquidity', function() {
        it('liquidityOwned', async function() {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT));
        });

        it('pair reserves', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(200000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(50000000));
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(100000000));
          expect(result[1]).to.be.bignumber.equal(new BN(200000));
        });

        it('totalValue', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(100000));
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
        });
      });      
      describe('With existing liquidity', function() {
        beforeEach(async function() {
          await this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"});
        });

        it('liquidityOwned', async function() {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(100000000));
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(150000000));
          expect(result[1]).to.be.bignumber.equal(new BN(300000));
        });

        it('totalValue', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(199999)); // rounding error
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('Transfers held ETH and burns FEI', function() {
        beforeEach(async function() {
          await web3.eth.sendTransaction({from: userAddress, to:this.pcvDeposit.address, value: "100000"});
          await this.fei.mint(this.pcvDeposit.address, "1000", {from: minterAddress});
          await this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"});
        });

        it('liquidityOwned', async function() {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(400000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(150000000));
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(200000000));
          expect(result[1]).to.be.bignumber.equal(new BN(400000));
        });

        it('totalValue', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(266666)); // rounding error
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('After price move', function() {
        beforeEach(async function() {
          // Simulate ETH doubling to 1000:1
          await this.fei.mint(this.pair.address, 100000000, {from: minterAddress});  
          await this.pair.setReserves(200000, 200000000);
          // Then deposit
          await this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"});
        });

        it('liquidityOwned', async function() {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(250000000));
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(300000000));
          expect(result[1]).to.be.bignumber.equal(new BN(300000));
        });

        it('totalValue', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(199999)); // rounding error
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('Incorrect ETH amount', function() {
        it('reverts', async function() {
          await expectRevert(this.pcvDeposit.deposit("100000", {from: userAddress, value: "10"}), "Bonding Curve: Sent value does not equal input");
        });
      });
    });
  });

  describe('Withdraw', function() {

    describe('Paused', function() {
      it('reverts', async function() {
        await this.pcvDeposit.pause({from: governorAddress});
        await expectRevert(this.pcvDeposit.withdraw(beneficiaryAddress1, "100000", {from: pcvControllerAddress}), "Pausable: paused");
      });
    });

    describe('Reverts', function() {
      it('not pcv controller', async function() {
        await expectRevert(this.pcvDeposit.withdraw(beneficiaryAddress1, "100000", {from: userAddress}), "CoreRef: Caller is not a PCV controller");
      });

      it('no balance', async function() {
        await this.core.grantPCVController(userAddress, {from: governorAddress});
        await expectRevert(this.pcvDeposit.withdraw(beneficiaryAddress1, "100000", {from: userAddress}), "UniswapPCVDeposit: Insufficient underlying");
      });
    });
    describe('With Balance', function() {
      beforeEach(async function() {
        await this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"});
        this.beneficiaryBalance = await balance.current(beneficiaryAddress1);
      });

      describe('Partial', function() {
        beforeEach(async function() {
          expectEvent(
            await this.pcvDeposit.withdraw(beneficiaryAddress1, "50000", {from: pcvControllerAddress}),
            'Withdrawal',
            {
              _caller: pcvControllerAddress,
              _to: beneficiaryAddress1,
              _amount: "50000"
            }
          );
        });

        it('user balance updates', async function() {
          expect(await balance.current(beneficiaryAddress1)).to.be.bignumber.equal(new BN(50000).add(this.beneficiaryBalance));
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
        });

        it('pair balances update', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(150000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(25000000));
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(75000000));
          expect(result[1]).to.be.bignumber.equal(new BN(150000));
        });

        it('liquidityOwned', async function() {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT / 2));
        });
      });

      describe('Total', function() {
        beforeEach(async function() {
          await this.pcvDeposit.withdraw(beneficiaryAddress1, "100000", {from: pcvControllerAddress});
        });

        it('user balance updates', async function() {
          expect(await balance.current(beneficiaryAddress1)).to.be.bignumber.equal(new BN(100000).add(this.beneficiaryBalance));
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
        });

        it('liquidityOwned', async function() {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(0));
        });

        it('pair balances update', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(100000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(0));
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(50000000));
          expect(result[1]).to.be.bignumber.equal(new BN(100000));
        });
      });
    });
  });

  describe('Access', function() {
    describe('Pair', function() {
      it('Governor set succeeds', async function() {
        let pair2 = await MockPair.new(this.token.address, this.fei.address);
        expectEvent(
          await this.pcvDeposit.setPair(pair2.address, {from: governorAddress}), 
          'PairUpdate', 
          { _pair : pair2.address }
        );
        expect(await this.pcvDeposit.pair()).to.be.equal(pair2.address);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvDeposit.setPair(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});