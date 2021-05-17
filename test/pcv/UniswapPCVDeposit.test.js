

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
  expect,
  contract,
  getCore
} = require('../helpers');

const UniswapPCVDeposit = contract.fromArtifact('UniswapPCVDeposit');
const Fei = contract.fromArtifact('Fei');
const MockWeth = contract.fromArtifact('MockWeth');
const MockOracle = contract.fromArtifact('MockOracle');
const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');
const MockRouter = contract.fromArtifact('MockRouter');

describe('EthUniswapPCVDeposit', function () {
  const LIQUIDITY_INCREMENT = 10000; // amount of liquidity created by mock for each deposit

  beforeEach(async function () {
    this.core = await getCore(true);

    this.fei = await Fei.at(await this.core.fei());
    this.weth = await MockWeth.new();
    this.pair = await MockPair.new(this.fei.address, this.weth.address);
    this.oracle = await MockOracle.new(400); // 400:1 oracle price
    this.router = await MockRouter.new(this.pair.address);
    this.router.setWETH(this.weth.address);
    this.pcvDeposit = await UniswapPCVDeposit.new(this.core.address, this.pair.address, this.router.address, this.oracle.address);
    await this.pcvDeposit.setMaxBasisPointsFromPegLP(100, {from: governorAddress});

    await this.core.grantMinter(this.pcvDeposit.address, {from: governorAddress});

    await this.pair.set(50000000, 100000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 500:1 FEI/ETH with 10k liquidity
    await this.fei.mint(this.pair.address, 50000000, {from: minterAddress});  
    await this.weth.mint(this.pair.address, 100000);  
  });

  describe('Deposit', function() {
    describe('Paused', function() {
      it('reverts', async function() {
        await this.pcvDeposit.pause({from: governorAddress});
        await expectRevert(this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"}), "Pausable: paused");
      });
    });

    describe('Pre deposit values', function() {
      it('liquidityOwned', async function(){
        expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(0));
      });

      it('pair reserves', async function() {
        expect(await this.weth.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(100000));
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(50000000));
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
          expect(await this.weth.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(200000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(90000000)); // deposits at oracle price
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(90000000));
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
          expect(await this.weth.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(130000000)); // deposits at oracle price
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(130000000));
          expect(result[1]).to.be.bignumber.equal(new BN(300000));
        });

        it('totalValue', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(199999)); // rounding error
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('Pool price changes under threshold', function() {
        it('reverts', async function() {
          await this.router.setAmountMin(39000000);
          await expectRevert(this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"}), "amount liquidity revert");
        });

        describe('after threshold update', function() {
          beforeEach(async function() {
            await this.router.setAmountMin(39000000);
            await this.pcvDeposit.setMaxBasisPointsFromPegLP(300, {from: governorAddress});
            await this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"});
          });
  
          it('liquidityOwned', async function() {
            expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT * 2));
          });
  
          it('pair reserves', async function() {
            expect(await this.weth.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(300000));
            expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(130000000)); // deposits at oracle price
            let result = await this.pcvDeposit.getReserves();
            expect(result[0]).to.be.bignumber.equal(new BN(130000000));
            expect(result[1]).to.be.bignumber.equal(new BN(300000));
          });
  
          it('totalValue', async function() {
            expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(199999)); // rounding error
          });
  
          it('no fei held', async function() {
            expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
          });
        });
      });

      describe('Pool price changes over threshold', function() {
        beforeEach(async function() {
          await this.router.setAmountMin(41000000);
          await this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"});
        });

        it('liquidityOwned', async function() {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function() {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(130000000)); // deposits at oracle price
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(130000000));
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
          expect(await this.weth.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(400000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(170000000)); // deposits at oracle price
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(170000000));
          expect(result[1]).to.be.bignumber.equal(new BN(400000));
        });

        it('totalValue', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(266666)); // rounding error
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('After oracle price move', function() {
        beforeEach(async function() {
          await this.oracle.setExchangeRate(600); // 600:1 oracle price
          // Then deposit
          await this.pcvDeposit.deposit("100000", {from: userAddress, value: "100000"});
        });

        it('liquidityOwned', async function() {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function() {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(150000000));
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

      describe('Incorrect ETH amount', function() {
        it('reverts', async function() {
          await expectRevert(this.pcvDeposit.deposit("100000", {from: userAddress, value: "10"}), "UniswapPCVDeposit: balance too low");
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
        this.beneficiaryBalance = await this.weth.balanceOf(beneficiaryAddress1);
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
          expect(await this.weth.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(new BN(50000).add(this.beneficiaryBalance));
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
        });

        it('pair balances update', async function() {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(150000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(67500000));
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(67500000));
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
          expect(await this.weth.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(new BN(100000).add(this.beneficiaryBalance));
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.bignumber.equal(new BN(0));
        });

        it('liquidityOwned', async function() {
          expect(await this.pcvDeposit.liquidityOwned()).to.be.bignumber.equal(new BN(0));
        });

        it('pair balances update', async function() {
          expect(await this.weth.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(100000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(45000000));
          let result = await this.pcvDeposit.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(45000000));
          expect(result[1]).to.be.bignumber.equal(new BN(100000));
        });
      });
    });
  });

  describe('Access', function() {
    describe('setMaxBasisPointsFromPegLP', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.pcvDeposit.setMaxBasisPointsFromPegLP(300, {from: governorAddress}), 
          'MaxBasisPointsFromPegLPUpdate', 
          { 
            oldMaxBasisPointsFromPegLP : '100',
            newMaxBasisPointsFromPegLP : '300'
          }
        );
        expect(await this.pcvDeposit.maxBasisPointsFromPegLP()).to.be.bignumber.equal('300');
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvDeposit.setMaxBasisPointsFromPegLP(300, {from: userAddress}), "CoreRef: Caller is not a governor");
      });

      it('over 100%', async function() {
        await expectRevert(this.pcvDeposit.setMaxBasisPointsFromPegLP(10001, {from: governorAddress}), "UniswapPCVDeposit: basis points from peg too high");
      });
    });

    describe('Pair', function() {
      it('Governor set succeeds', async function() {
        let pair2 = await MockPair.new(this.weth.address, this.fei.address);
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