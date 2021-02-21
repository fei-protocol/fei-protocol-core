const {
  minterAddress, 
  userAddress, 
  governorAddress,
  BN,
  expectRevert,
  expect,
  time,
  MAX_UINT256,
  Fei,
  FeiRouter,
  MockUniswapIncentive,
  MockPair,
  MockWeth,
  getCore,
  ether
} = require('../helpers');

describe('FeiRouter', function () {

  beforeEach(async function () {
    this.core = await getCore(true);

    this.fei = await Fei.at(await this.core.fei());

    this.weth = await MockWeth.new();
    this.weth.deposit({value: ether("1")});

    this.pair = await MockPair.new(this.fei.address, this.weth.address);
    this.pair.setReserves("50000000", "100000");

    this.incentive = await MockUniswapIncentive.new(this.core.address);
    this.core.grantMinter(this.incentive.address, {from: governorAddress});
    await this.fei.setIncentiveContract(this.pair.address, this.incentive.address, {from: governorAddress});

    this.router = await FeiRouter.new(this.pair.address, this.weth.address, this.core.address);
  
    this.fei.approve(this.router.address, "1000000000000", {from: userAddress});
    this.fei.mint(userAddress, "1000000000000", {from: minterAddress});

    this.weth.mint(this.router.address, "1000000000");
  });

  describe('Incentive Contract', function() {
    it('updates automatically', async function() {
      await this.fei.setIncentiveContract(this.pair.address, userAddress, {from: governorAddress});
      expect(await this.router.incentiveContract()).to.be.equal(userAddress);
    });
  });

  describe('Buy', function () {
    describe('Mint', function() {
      describe('Not enough mint', function () {
        it('reverts', async function () {
          await expectRevert(this.router.buyFei(1001, 10000, userAddress, MAX_UINT256, {value: 30, from: userAddress}), "FeiRouter: Not enough reward");
        });
      });

      describe('Exempt with enough mint', function () {
        beforeEach(async function() {
          await this.incentive.setExempt(true);
        });

        it('reverts', async function () {
          await expectRevert(this.router.buyFei(1000, 10000, userAddress, MAX_UINT256, {value: 30, from: userAddress}), "FeiRouter: Not enough reward");
        });
      });

      describe('Sufficient mint', function () {
        it('succeeds', async function () {
          await this.router.buyFei(1000, 10000, userAddress, MAX_UINT256, {value: 30, from: userAddress});
        });
      });
    });

    describe('Deadline', function() {
      beforeEach(async function() {
        this.timestamp = await time.latest();
      });

      describe('Too late', function () {
        it('reverts', async function () {
          await expectRevert(this.router.buyFei(1000, 10000, userAddress, this.timestamp.sub(new BN('10')), {value: 30, from: userAddress}), "UniswapSingleEthRouter: EXPIRED");
        });
      });

      describe('On time', function () {
        it('succeeds', async function () {
          await this.router.buyFei(1000, 10000, userAddress, this.timestamp.add(new BN('10')), {value: 30, from: userAddress});
        });
      });
    });

    describe('Slippage', function() {
      describe('Too high', function () {
        it('reverts', async function () {
          await expectRevert(this.router.buyFei(1000, 10000, userAddress, MAX_UINT256, {value: 20, from: userAddress}), "UniswapSingleEthRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        });
      });

      describe('Acceptable', function () {
        it('succeeds', async function () {
          await this.router.buyFei(1000, 10000, userAddress, MAX_UINT256, {value: 21, from: userAddress});
        });
      });
    });
  });

  describe('Sell', function () {
    describe('Burn', function() {
      describe('Too much burn', function () {
        it('reverts', async function () {
          await expectRevert(this.router.sellFei(999, 10000, 10, userAddress, MAX_UINT256, {from: userAddress}), "FeiRouter: Penalty too high");
        });
      });

      describe('Sufficient burn', function () {
        it('succeeds', async function () {
          await this.router.sellFei(1000, 10000, 10, userAddress, MAX_UINT256, {from: userAddress});
        });
      });

      describe('Exempt with too much burn', function () {
        beforeEach(async function() {
          await this.incentive.setExempt(true);
        });

        it('reverts', async function () {
          await this.router.sellFei(1000, 10000, 10, userAddress, MAX_UINT256, {from: userAddress});
        });
      });
    });

    describe('Deadline', function() {
      beforeEach(async function() {
        this.timestamp = await time.latest();
      });

      describe('Too late', function () {
        it('reverts', async function () {
          await expectRevert(this.router.sellFei(1000, 10000, 10, userAddress, this.timestamp.sub(new BN('10')), {from: userAddress}), "UniswapSingleEthRouter: EXPIRED");
        });
      });

      describe('On time', function () {
        it('succeeds', async function () {
          await this.router.sellFei(1000, 10000, 10, userAddress, this.timestamp.add(new BN('10')), {from: userAddress});
        });
      });
    });

    describe('Slippage', function() {
      describe('Too high', function () {
        it('reverts', async function () {
          await expectRevert(this.router.sellFei(1000, 10000, 20, userAddress, MAX_UINT256, {from: userAddress}), "UniswapSingleEthRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        });
      });

      describe('Acceptable', function () {
        it('succeeds', async function () {
          await this.router.sellFei(1000, 10000, 19, userAddress, MAX_UINT256, {from: userAddress});
        });
      });
    });
  });
});