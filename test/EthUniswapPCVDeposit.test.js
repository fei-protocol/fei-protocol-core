const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const EthUniswapPCVDeposit = contract.fromArtifact('EthUniswapPCVDeposit');
const Core = contract.fromArtifact('Core');
const Fei = contract.fromArtifact('Fei');
const MockERC20 = contract.fromArtifact('MockERC20');
const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');
const MockRouter = contract.fromArtifact('MockRouter');

describe('EthUniswapPCVDeposit', function () {
  const [ userAddress, governorAddress, minterAddress, beneficiaryAddress ] = accounts;
  const LIQUIDITY_INCREMENT = 10000; // amount of liquidity created by mock for each deposit

  beforeEach(async function () {
    this.core = await Core.new({gas: 8000000, from: governorAddress});
    this.fei = await Fei.at(await this.core.fei());
    this.token = await MockERC20.new();
    this.pair = await MockPair.new(this.token.address, this.fei.address);
    this.router = await MockRouter.new(this.pair.address);
    this.allocation = await EthUniswapPCVDeposit.new(this.token.address, this.core.address);
    await this.core.grantMinter(this.allocation.address, {from: governorAddress});
    await this.core.grantMinter(minterAddress, {from: governorAddress});
    await this.fei.mint(this.pair.address, 50000000, {from: minterAddress});

    await this.allocation.setPair(this.pair.address, {from: governorAddress});
    await this.allocation.setRouter(this.router.address, {from: governorAddress});
    await this.pair.set(100000, 50000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 500:1 FEI/ETH with 10k liquidity
  });

  describe('Deposit', function() {
    describe('Pre deposit values', function() {
      it('liquidityOwned', async function(){
        expect(await this.allocation.liquidityOwned()).to.be.bignumber.equal(new BN(0));
      });

      it('pair reserves', async function() {
        expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(100000));
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(50000000));
        let result = await this.allocation.getReserves();
        expect(result[0]).to.be.bignumber.equal(new BN(50000000));
        expect(result[1]).to.be.bignumber.equal(new BN(100000));
      });
      it('totalValue', async function(){
        expect(await this.allocation.totalValue()).to.be.bignumber.equal(new BN(0));
      });
    });
    describe('Post deposit values', function() {
      beforeEach(async function() {
        await this.allocation.deposit("100000", {from: userAddress, value: "100000"});
      });

      describe('No existing liquidity', function() {
        it('liquidityOwned', async function() {
          expect(await this.allocation.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT));
        });

        it('pair reserves', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(200000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(100000000));
          let result = await this.allocation.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(100000000));
          expect(result[1]).to.be.bignumber.equal(new BN(200000));
        });

        it('totalValue', async function() {
          expect(await this.allocation.totalValue()).to.be.bignumber.equal(new BN(100000));
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.allocation.address)).to.be.bignumber.equal(new BN(0));
        });
      });      
      describe('With existing liquidity', function() {
        beforeEach(async function() {
          await this.allocation.deposit("100000", {from: userAddress, value: "100000"});
        });

        it('liquidityOwned', async function() {
          expect(await this.allocation.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(150000000));
          let result = await this.allocation.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(150000000));
          expect(result[1]).to.be.bignumber.equal(new BN(300000));
        });

        it('totalValue', async function() {
          expect(await this.allocation.totalValue()).to.be.bignumber.equal(new BN(199999)); // rounding error
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.allocation.address)).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('After price move', function() {
        beforeEach(async function() {
          // Simulate ETH doubling to 1000:1
          await this.fei.mint(this.pair.address, 100000000, {from: minterAddress});  
          await this.pair.setReserves(200000, 200000000);
          // Then deposit
          await this.allocation.deposit("100000", {from: userAddress, value: "100000"});
        });

        it('liquidityOwned', async function() {
          expect(await this.allocation.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT * 2));
        });

        it('pair reserves', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(300000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(300000000));
          let result = await this.allocation.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(300000000));
          expect(result[1]).to.be.bignumber.equal(new BN(300000));
        });

        it('totalValue', async function() {
          expect(await this.allocation.totalValue()).to.be.bignumber.equal(new BN(199999)); // rounding error
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.allocation.address)).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('Incorrect ETH amount', function() {
        it('reverts', async function() {
          await expectRevert(this.allocation.deposit("100000", {from: userAddress, value: "10"}), "Bonding Curve: Sent value does not equal input");
        });
      });
    });
  });

  describe('Withdraw', function() {
    describe('Reverts', function() {
      it('not reclaimer', async function() {
        await expectRevert(this.allocation.withdraw(beneficiaryAddress, "100000", {from: userAddress}), "CoreRef: Caller is not a reclaimer");
      });

      it('no balance', async function() {
        await this.core.grantReclaimer(userAddress, {from: governorAddress});
        await expectRevert(this.allocation.withdraw(beneficiaryAddress, "100000", {from: userAddress}), "UniswapPCVDeposit: Insufficient underlying");
      });
    });
    describe('With Balance', function() {
      beforeEach(async function() {
        await this.core.grantReclaimer(userAddress, {from: governorAddress});
        await this.allocation.deposit("100000", {from: userAddress, value: "100000"});
        this.beneficiaryBalance = await balance.current(beneficiaryAddress);
      });

      describe('Partial', function() {
        beforeEach(async function() {
          await this.allocation.withdraw(beneficiaryAddress, "50000", {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await balance.current(beneficiaryAddress)).to.be.bignumber.equal(new BN(50000).add(this.beneficiaryBalance));
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.allocation.address)).to.be.bignumber.equal(new BN(0));
        });

        it('pair balances update', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(150000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(75000000));
          let result = await this.allocation.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(75000000));
          expect(result[1]).to.be.bignumber.equal(new BN(150000));
        });

        it('liquidityOwned', async function() {
          expect(await this.allocation.liquidityOwned()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT / 2));
        });
      });

      describe('Total', function() {
        beforeEach(async function() {
          await this.allocation.withdraw(beneficiaryAddress, "100000", {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await balance.current(beneficiaryAddress)).to.be.bignumber.equal(new BN(100000).add(this.beneficiaryBalance));
        });

        it('no fei held', async function() {
          expect(await this.fei.balanceOf(this.allocation.address)).to.be.bignumber.equal(new BN(0));
        });

        it('liquidityOwned', async function() {
          expect(await this.allocation.liquidityOwned()).to.be.bignumber.equal(new BN(0));
        });

        it('pair balances update', async function() {
          expect(await balance.current(this.pair.address)).to.be.bignumber.equal(new BN(100000));
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(50000000));
          let result = await this.allocation.getReserves();
          expect(result[0]).to.be.bignumber.equal(new BN(50000000));
          expect(result[1]).to.be.bignumber.equal(new BN(100000));
        });
      });
    });
  });

  describe('Access', function() {
    describe('Pair', function() {
      it('Governor set succeeds', async function() {
        await this.allocation.setPair(userAddress, {from: governorAddress});
        expect(await this.allocation.pair()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.allocation.setPair(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Router', function() {
      it('Governor set succeeds', async function() {
        await this.allocation.setRouter(userAddress, {from: governorAddress});
        expect(await this.allocation.router()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.allocation.setRouter(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Token', function() {
      it('Governor set succeeds', async function() {
        this.altToken = await MockERC20.new();
        await this.allocation.setToken(this.altToken.address, {from: governorAddress});
        expect(await this.allocation.token()).to.be.equal(this.altToken.address);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.allocation.setToken(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});