const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const EthUniswapAllocation = contract.fromArtifact('EthUniswapAllocation');
const Core = contract.fromArtifact('Core');
const Fii = contract.fromArtifact('Fii');
const MockERC20 = contract.fromArtifact('MockERC20');
const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');

describe('EthUniswapAllocation', function () {
  const [ userAddress, governorAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({gas: 8000000, from: governorAddress});
    this.fii = await Fii.at(await this.core.fii());
    this.token = await MockERC20.new();
    this.pair = await MockPair.new(this.token.address);
    this.allocation = await EthUniswapAllocation.new(this.token.address, this.core.address);
    await this.core.grantMinter(this.allocation.address, {from: governorAddress});
    await this.allocation.setPair(this.pair.address, {from: governorAddress});
    await this.pair.set(100000, 50000000, 10000); // 500:1 FII/ETH with 10k liquidity
  });

  describe('Deposit', function() {
    describe('Pre deposit values', function() {
      it('getReserves', async function(){
        let result = await this.allocation.getReserves();
        expect(result[0]).to.be.bignumber.equal(new BN(50000000));
        expect(result[1]).to.be.bignumber.equal(new BN(100000));
      });

      it('liquidityOwned', async function(){
        expect(await this.allocation.liquidityOwned()).to.be.bignumber.equal(new BN(0));

      });

      it('totalValue', async function(){
        expect(await this.allocation.totalValue()).to.be.bignumber.equal(new BN(0));
      });
    });
    describe('Post deposit values', function() {
      describe('No existing liquidity', function() {

      });      
      describe('With existing liquidity', function() {

      });
      describe('After price move', function() {

      });
    });
  });

  describe('Withdraw', function() {

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
        await this.allocation.setToken(userAddress, {from: governorAddress});
        expect(await this.allocation.token()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.allocation.setToken(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});