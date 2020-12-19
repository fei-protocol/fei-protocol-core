const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const IDO = contract.fromArtifact('IDO');
const Core = contract.fromArtifact('Core');
const Fei = contract.fromArtifact('Fei');
const Tribe = contract.fromArtifact('Tribe');
const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');
const MockRouter = contract.fromArtifact('MockRouter');

describe('IDO', function () {
  const [ userAddress, governorAddress, minterAddress, beneficiaryAddress, genesisGroup ] = accounts;
  const LIQUIDITY_INCREMENT = 10000; // amount of liquidity created by mock for each deposit

  beforeEach(async function () {
    this.core = await Core.new({from: governorAddress});
    await this.core.setGenesisGroup(genesisGroup, {from: governorAddress});
    this.fei = await Fei.at(await this.core.fei());
    this.tribe = await Tribe.at(await this.core.tribe());

    this.pair = await MockPair.new(this.tribe.address, this.fei.address);
    this.router = await MockRouter.new(this.pair.address);

    this.window = new BN(4 * 365 * 24 * 60 * 60);
    this.ido = await IDO.new(this.core.address, beneficiaryAddress, this.window);
    await this.core.grantMinter(this.ido.address, {from: governorAddress});
    await this.core.allocateTribe(this.ido.address, 100000, {from: governorAddress});

    await this.ido.setPair(this.pair.address, {from: governorAddress});
    await this.ido.setRouter(this.router.address, {from: governorAddress});
  });

  describe('Deploy', function() {
    describe('Not Genesis Group', function() {
      it('reverts', async function() {
        await expectRevert(this.ido.deploy(['5000000000000000000'], {from: userAddress}), "CoreRef: Caller is not GenesisGroup");
      });
    });

    describe('From Genesis Group', function() {
      beforeEach(async function() {
        expectEvent(
          await this.ido.deploy(['5000000000000000000'], {from: genesisGroup}),
          'Deploy',
          {
            _amountFei: "500000",
            _amountTribe: "100000"
          }
        );
      });

      it('updates ido balances', async function() {
        expect(await this.fei.balanceOf(this.ido.address)).to.be.bignumber.equal(new BN(0));
        expect(await this.tribe.balanceOf(this.ido.address)).to.be.bignumber.equal(new BN(0));
        expect(await this.pair.balanceOf(this.ido.address)).to.be.bignumber.equal(new BN(10000));
      });

      it('updates pair balances', async function() {
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(500000));
        expect(await this.tribe.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(100000));
      });
    });
  });
});