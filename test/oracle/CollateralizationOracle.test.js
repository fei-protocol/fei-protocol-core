const {
  userAddress,
  governorAddress,
  guardianAddress,
  BN,
  expectEvent,
  expectRevert,
  time,
  expect,
  UniswapOracle,
  CollateralizationOracle,
  MockPairTrade,
  EthUniswapPCVDeposit,
  MockRouter,
  Fei,
  MockWeth,
  MockPair,
  MockOracle,
  MockIncentive,
  minterAddress,
  getCore
} = require('../helpers');

describe('CollateralizationOracle', function () {
  beforeEach(async function () {
    this.core = await getCore(true);

    this.fei = await Fei.at(await this.core.fei());
    this.ethPriceOracle = await MockOracle.new(500);
    this.token = await MockWeth.new();
    this.pair = await MockPair.new(this.token.address, this.fei.address);
    this.router = await MockRouter.new(this.pair.address);
    await this.router.setWETH(this.token.address);
    this.pcvDeposit = await EthUniswapPCVDeposit.new(this.core.address, this.pair.address, this.router.address, this.ethPriceOracle.address);
    await this.core.grantMinter(this.pcvDeposit.address, {from: governorAddress});
    this.incentive = await MockIncentive.new(this.core.address);

    await this.fei.setIncentiveContract(this.pair.address, this.incentive.address, {from: governorAddress});
    await this.incentive.setExempt(true);

    this.collateralizationOracle = await CollateralizationOracle.new(
      this.core.address,
      this.ethPriceOracle.address,
      this.pcvDeposit.address
    );
  });

  describe('Init', function() {
    it('ethPriceOracle', async function() {
      expect(await this.collateralizationOracle.ethPriceOracle()).to.be.equal(this.ethPriceOracle.address);
    });

    it('not paused', async function() {
      expect(await this.collateralizationOracle.paused()).to.be.equal(false);
    });
  });

  describe('view properties', function() {
    beforeEach(async function() {
      // 50 000 000 $ worth of ETH in PCV
      // 500 $ / ETH
      // 40 000 000 FEI in circulation
      await this.pair.set(1e5, 500e5, 10e3, {from: userAddress, value: 1e5}); // 500:1 FEI/ETH with 10k liquidity
      await this.fei.mint(this.pcvDeposit.address, 550e5, {from: minterAddress}); // seed Fei to burn
      await this.fei.mint(userAddress, 400e5, {from: minterAddress}); // some additional circulating Fei
      await this.pcvDeposit.deposit(1e5, {value: 1e5}); // deposit LP
      await this.collateralizationOracle.update();
    });

    it('circulatingFei', async function() {
      let result = await this.collateralizationOracle.circulatingFei();
      expect(result).to.be.bignumber.equal(new BN(400e5));
    });

    it('ethPcv', async function() {
      let result = await this.collateralizationOracle.ethPcv();
      expect(result).to.be.bignumber.equal(new BN(1e5));
    });

    it('ethUsd', async function() {
      let result = await this.collateralizationOracle.ethUsd();
      expect(result).to.be.bignumber.equal(new BN(500));
    });
  });

  describe('Read', function() {
    beforeEach(async function() {
      // 50 000 000 $ worth of ETH in PCV
      // 500 $ / ETH
      // 40 000 000 FEI in circulation
      await this.pair.set(1e5, 500e5, 10e3, {from: userAddress, value: 1e5}); // 500:1 FEI/ETH with 10k liquidity
      await this.fei.mint(this.pcvDeposit.address, 550e5, {from: minterAddress}); // seed Fei to burn
      await this.fei.mint(userAddress, 400e5, {from: minterAddress}); // some additional circulating Fei
      await this.pcvDeposit.deposit(1e5, {value: 1e5}); // deposit LP
      await this.collateralizationOracle.update();
    });

    describe('Paused', function() {
      beforeEach(async function() {
        await this.collateralizationOracle.pause({from: governorAddress});
      });

      it('returns invalid', async function() {
        let result = await this.collateralizationOracle.read();
        expect(result[1]).to.be.equal(false);
      });
    });

    describe('Unpaused', function() {
      it('returns valid', async function() {
        let result = await this.collateralizationOracle.read();
        expect(result[1]).to.be.equal(true);
      });

      it('current collateralization ratio', async function() {
        let result = await this.collateralizationOracle.read();
        expect(result[0].value).to.be.equal('1250000000000000000'); // 1.25 with 18 decimals
        expect(result[1]).to.be.equal(true); // valid
      });
    });
  });
  describe('Update', function() {
    describe('Paused', function() {
      it('reverts', async function() {
        await this.collateralizationOracle.pause({from: governorAddress});
        await expectRevert(this.collateralizationOracle.update(), "Pausable: paused");
      });
    });
  });
});
