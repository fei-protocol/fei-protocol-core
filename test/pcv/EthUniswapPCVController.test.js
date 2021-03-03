const {
  userAddress, 
  governorAddress, 
  minterAddress, 
  guardianAddress, 
  BN,
  expectEvent,
  expectRevert,
  balance,
  expect,
  EthUniswapPCVController,
  Fei,
  MockBot,
  MockPCVDeposit,
  MockOracle,
  MockPair,
  MockRouter,
  MockWeth,
  MockIncentive,
  getCore
} = require('../helpers');

describe('EthUniswapPCVController', function () {
  const LIQUIDITY_INCREMENT = 10000; // amount of liquidity created by mock for each deposit

  beforeEach(async function () {
    this.core = await getCore(true);

    this.fei = await Fei.at(await this.core.fei());
    this.oracle = await MockOracle.new(500);
    this.token = await MockWeth.new();
    this.pair = await MockPair.new(this.token.address, this.fei.address);
    this.router = await MockRouter.new(this.pair.address);
    await this.router.setWETH(this.token.address);
    this.pcvDeposit = await MockPCVDeposit.new(this.pair.address);
    this.incentive = await MockIncentive.new(this.core.address);

    await this.fei.setIncentiveContract(this.pair.address, this.incentive.address, {from: governorAddress});
    await this.incentive.setExempt(true);

    this.pcvController = await EthUniswapPCVController.new(
      this.core.address, 
      this.pcvDeposit.address, 
      this.oracle.address, 
      '100000000000000000000',
      '100',
      this.pair.address,
      this.router.address
    );
    await this.core.grantPCVController(this.pcvController.address, {from: governorAddress});
    await this.fei.mint(this.pair.address, 50000000, {from: minterAddress});
  });

  describe('Sole LP', function() {
    beforeEach(async function() {
      await this.pcvDeposit.deposit(100000, {value: 100000}); // deposit LP
      await this.fei.mint(this.pcvController.address, 50000000, {from: minterAddress}); // seed Fei to burn
      await this.pcvController.forceReweight({from: guardianAddress});
    });
    it('pcvDeposit gets all ETH', async function() {
      expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(100000));
      expect(await balance.current(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
    });
    it('controller has no FEI', async function() {
      expect(await this.fei.balanceOf(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
    });
  });

  describe('With Other LP', function() {
    describe('At peg', function() {
      beforeEach(async function() {
        await this.pair.set(100000, 50000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 500:1 FEI/ETH with 10k liquidity
        await this.pcvDeposit.deposit(100000, {value: 100000}); // deposit LP
        await this.fei.mint(this.pcvController.address, 50000000, {from: minterAddress}); // seed Fei to burn
      });

      it('reverts', async function() {
        await expectRevert(this.pcvController.forceReweight({from: governorAddress}), "EthUniswapPCVController: already at or above peg");
      });
    });

    describe('Above peg', function() {
      beforeEach(async function() {
        await this.pair.set(100000, 49000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 490:1 FEI/ETH with 10k liquidity
        await this.pcvDeposit.deposit(100000, {value: 100000}); // deposit LP
        await this.fei.mint(this.pcvController.address, 50000000, {from: minterAddress}); // seed Fei to burn
      });

      it('reverts', async function() {
        await expectRevert(this.pcvController.forceReweight({from: governorAddress}), "EthUniswapPCVController: already at or above peg");
      });
    });

    describe('Below peg', function() {
      describe('Enough to reweight', function() {
        beforeEach(async function() {
          await this.pair.set(100000, 51000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 490:1 FEI/ETH with 10k liquidity
          await this.pcvDeposit.deposit(100000, {value: 100000}); // deposit LP
          await this.fei.mint(this.pcvController.address, 50000000, {from: minterAddress}); // seed Fei to burn
          expectEvent(
            await this.pcvController.forceReweight({from: guardianAddress}),
            'Reweight',
            { _caller: guardianAddress }
          );
        });

        it('pair gets some ETH in swap', async function() {
          expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(995));
        });
        it('pcvDeposit gets remaining ETH', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(99005));
          expect(await balance.current(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
        });

        it('controller has no FEI', async function() {
          expect(await this.fei.balanceOf(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('Not enough to reweight', function() {
        beforeEach(async function() {
          await this.fei.mint(this.pair.address, 10000000000, {from: minterAddress});
          await this.pair.set(100000, 10000000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 100000:1 FEI/ETH with 10k liquidity
          await this.pcvDeposit.deposit(100000, {value: 100000}); // deposit LP
          await this.fei.mint(this.pcvController.address, 50000000, {from: minterAddress}); // seed Fei to burn
          await this.pcvController.forceReweight({from: governorAddress});
        });

        it('pair gets all withdrawn ETH in swap', async function() {
          expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(99000));
        });

        it('pcvDeposit only keeps non-withdrawn ETH', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(1000));
          expect(await balance.current(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
        });

        it('controller has no FEI', async function() {
          expect(await this.fei.balanceOf(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
        });
      });
    });
  });

  describe('External Reweight', function() {
    describe('Paused', function() {
      it('reverts', async function() {
        await this.pcvController.pause({from: governorAddress});
        await expectRevert(this.pcvController.reweight(), "Pausable: paused");
      });
    });

    describe('From Contract', function() {
      it('reverts', async function() {
        let bot = await MockBot.new();
        await expectRevert(bot.controllerReweight(this.pcvController.address), "CoreRef: Caller is a contract");
      });
    });

    describe('Not at incentive parity', function () {
      it('reverts', async function() {
        await this.pair.set(100000, 51000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 510:1 FEI/ETH with 10k liquidity
        expect(await this.pcvController.reweightEligible()).to.be.equal(false);
        await expectRevert(this.pcvController.reweight(), "EthUniswapPCVController: Not at incentive parity or not at min distance");
      })
    });

    describe('Not at min distance', function () {
      it('reverts', async function() {
        await this.pair.set(100000, 50400000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 504:1 FEI/ETH with 10k liquidity
        await this.incentive.setIncentiveParity(true);
        expect(await this.pcvController.reweightEligible()).to.be.equal(false);
        await expectRevert(this.pcvController.reweight(), "EthUniswapPCVController: Not at incentive parity or not at min distance");
      })
    });

    describe('No incentive for caller if controller not minter', function() {
        beforeEach(async function() {
          await this.pair.set(100000, 51000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 510:1 FEI/ETH with 10k liquidity
          await this.pcvDeposit.deposit(100000, {value: 100000}); // deposit LP
          await this.incentive.setIncentiveParity(true);
          expect(await this.pcvController.reweightEligible()).to.be.equal(true);
          await this.pcvController.reweight({from: userAddress});
        });

        it('pair gets some ETH in swap', async function() {
          expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(995));
        });
        it('pcvDeposit gets remaining ETH', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(99005));
          expect(await balance.current(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
        });
        it('user FEI balance is 0', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
        });
    });

    describe('Incentive for caller if controller is a minter', function() {
        beforeEach(async function() {
          await this.pair.set(100000, 51000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 490:1 FEI/ETH with 10k liquidity
          await this.pcvDeposit.deposit(100000, {value: 100000}); // deposit LP
          await this.incentive.setIncentiveParity(true);     
          await this.core.grantMinter(this.pcvController.address, {from: governorAddress});     
          expect(await this.pcvController.reweightEligible()).to.be.equal(true);
          await this.pcvController.reweight({from: userAddress});
        });

        it('pair gets some ETH in swap', async function() {
          expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(995));
        });
        it('pcvDeposit gets remaining ETH', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(99005));
          expect(await balance.current(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
        });
        it('user FEI balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN("100000000000000000000"));
        });
    });
  });

  describe('Access', function() {
    describe('Force Reweight', function() {
      it('Non-governor call fails', async function() {
        await expectRevert(this.pcvController.forceReweight({from: userAddress}), "CoreRef: Caller is not a guardian or governor");
      });
    });

    describe('Reweight Incentive', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.pcvController.setReweightIncentive(10000, {from: governorAddress}),
          'ReweightIncentiveUpdate',
          { _amount: '10000' }
        );
        expect(await this.pcvController.reweightIncentiveAmount()).to.be.bignumber.equal('10000');
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvController.setReweightIncentive(10000, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });

    describe('Reweight Withdraw Basis Points', function() {
      it('Governor set succeeds', async function() {
        this.withdrawBPs = new BN('5000')
        expectEvent(
          await this.pcvController.setReweightWithdrawBPs(this.withdrawBPs, {from: governorAddress}),
          'ReweightWithdrawBPsUpdate',
          { _reweightWithdrawBPs: this.withdrawBPs }
        );
        expect(await this.pcvController.reweightWithdrawBPs()).to.be.bignumber.equal(this.withdrawBPs);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvController.setReweightWithdrawBPs(new BN('5000'), {from: userAddress}), "CoreRef: Caller is not a governor");
      });

      it('Too large reverts', async function() {
        await expectRevert(this.pcvController.setReweightWithdrawBPs(new BN('50000'), {from: governorAddress}), "EthUniswapPCVController: withdraw percent too high");
      });
    });

    describe('Reweight Min Distance', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.pcvController.setReweightMinDistance(50, {from: governorAddress}),
          'ReweightMinDistanceUpdate',
          { _basisPoints: '50' }
        );
        expect((await this.pcvController.minDistanceForReweight())[0]).to.be.bignumber.equal('5000000000000000');
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvController.setReweightMinDistance(50, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });

    describe('Pair', function() {
      it('Governor set succeeds', async function() {
        let pair2 = await MockPair.new(this.token.address, this.fei.address);
        await this.pcvController.setPair(pair2.address, {from: governorAddress});
        expect(await this.pcvController.pair()).to.be.equal(pair2.address);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvController.setPair(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });

    describe('Incentive Contract', function() {
      it('updates automatically', async function() {
        await this.fei.setIncentiveContract(this.pair.address, userAddress, {from: governorAddress});
        expect(await this.pcvController.incentiveContract()).to.be.equal(userAddress);
      });
    });

    describe('PCV Deposit', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.pcvController.setPCVDeposit(userAddress, {from: governorAddress}),
          'PCVDepositUpdate',
          { _pcvDeposit: userAddress }
        );
        expect(await this.pcvController.pcvDeposit()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvController.setPCVDeposit(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Oracle', function() {
      it('Governor set succeeds', async function() {
        await this.pcvController.setOracle(userAddress, {from: governorAddress});
        expect(await this.pcvController.oracle()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvController.setOracle(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});