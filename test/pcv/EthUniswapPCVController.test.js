const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const EthUniswapPCVController = contract.fromArtifact('EthUniswapPCVController');
const Core = contract.fromArtifact('Core');
const Fei = contract.fromArtifact('Fei');
const MockPCVDeposit = contract.fromArtifact('MockEthUniswapPCVDeposit');
const MockOracle = contract.fromArtifact('MockOracle');
const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');
const MockRouter = contract.fromArtifact('MockRouter');
const MockWeth = contract.fromArtifact('MockWeth');
const MockIncentive = contract.fromArtifact('MockUniswapIncentive');

describe('EthUniswapPCVController', function () {
  const [ userAddress, governorAddress, minterAddress, beneficiaryAddress, genesisGroup ] = accounts;
  const LIQUIDITY_INCREMENT = 10000; // amount of liquidity created by mock for each deposit

  beforeEach(async function () {
    this.core = await Core.new({from: governorAddress});
    await this.core.setGenesisGroup(genesisGroup, {from: governorAddress});
    await this.core.completeGenesisGroup({from: genesisGroup});

    this.fei = await Fei.at(await this.core.fei());
    this.oracle = await MockOracle.new(500);
    this.token = await MockWeth.new();
    this.pair = await MockPair.new(this.token.address, this.fei.address);
    this.router = await MockRouter.new(this.pair.address);
    await this.router.setWETH(this.token.address);
    this.pcvDeposit = await MockPCVDeposit.new(this.pair.address);
    this.incentive = await MockIncentive.new(this.core.address);

    this.pcvController = await EthUniswapPCVController.new(this.core.address, this.pcvDeposit.address, this.oracle.address, this.incentive.address);
    await this.core.grantPCVController(this.pcvController.address, {from: governorAddress});
    await this.core.grantMinter(minterAddress, {from: governorAddress});
    await this.fei.mint(this.pair.address, 50000000, {from: minterAddress});

    await this.pcvController.setPair(this.pair.address, {from: governorAddress});
    await this.pcvController.setRouter(this.router.address, {from: governorAddress});
  });

  describe('Sole LP', function() {
    beforeEach(async function() {
      await this.pcvDeposit.deposit(100000, {value: 100000}); // deposit LP
      await this.fei.mint(this.pcvController.address, 50000000, {from: minterAddress}); // seed Fei to burn
      await this.pcvController.forceReweight({from: governorAddress});
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
            await this.pcvController.forceReweight({from: governorAddress}),
            'Reweight',
            { _caller: governorAddress }
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
          await this.pair.set(100000, 10000000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 100000:1 FEI/ETH with 10k liquidity
          await this.pcvDeposit.deposit(100000, {value: 100000}); // deposit LP
          await this.fei.mint(this.pcvController.address, 50000000, {from: minterAddress}); // seed Fei to burn
          await this.pcvController.forceReweight({from: governorAddress});
        });

        it('pair gets all ETH in swap', async function() {
          expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(100000));
        });

        it('pcvDeposit gets no ETH', async function() {
          expect(await this.pcvDeposit.totalValue()).to.be.bignumber.equal(new BN(0));
          expect(await balance.current(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
        });

        it('controller has no FEI', async function() {
          expect(await this.fei.balanceOf(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
        });
      });
    });
  });

  describe('External Reweight', function() {
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
        await expectRevert(this.pcvController.forceReweight({from: userAddress}), "CoreRef: Caller is not a governor");
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

    describe('Reweight Min Distance', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.pcvController.setReweightMinDistance(50, {from: governorAddress}),
          'ReweightMinDistanceUpdate',
          { _basisPoints: '50' }
        );
        expect(await this.pcvController.minDistanceForReweight()).to.be.bignumber.equal('5000000000000000');
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvController.setReweightMinDistance(50, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });

    describe('Pair', function() {
      it('Governor set succeeds', async function() {
        await this.pcvController.setPair(userAddress, {from: governorAddress});
        expect(await this.pcvController.pair()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvController.setPair(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });

    describe('Router', function() {
      it('Governor set succeeds', async function() {
        await this.pcvController.setRouter(userAddress, {from: governorAddress});
        expect(await this.pcvController.router()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvController.setRouter(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
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