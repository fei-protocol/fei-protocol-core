const {
  userAddress, 
  governorAddress, 
  minterAddress, 
  guardianAddress, 
  BN,
  expectEvent,
  expectRevert,
  balance,
  time,
  expect,
  contract,
  getCore,
  burnerAddress
} = require('../helpers');

const UniswapPCVController = artifacts.require('UniswapPCVController');
const Fei = artifacts.require('Fei');
const MockOracle = artifacts.require('MockOracle');
const MockPair = artifacts.require('MockUniswapV2PairLiquidity');
const MockPCVDeposit = artifacts.require('MockERC20UniswapPCVDeposit');
const MockERC20 = artifacts.require('MockERC20');

describe('UniswapPCVController', function () {
  const LIQUIDITY_INCREMENT = 10000; // amount of liquidity created by mock for each deposit

  beforeEach(async function () {
    this.core = await getCore(true);

    this.fei = await Fei.at(await this.core.fei());
    this.oracle = await MockOracle.new(500);
    this.token = await MockERC20.new();
    this.pair = await MockPair.new(this.token.address, this.fei.address);
    this.pcvDeposit = await MockPCVDeposit.new(this.token.address);

    this.pcvController = await UniswapPCVController.new(
      this.core.address, 
      this.pcvDeposit.address, 
      this.oracle.address, 
      '100000000000000000000',
      '100',
      this.pair.address,
      '14400'
    );
    await this.core.grantBurner(this.pcvController.address, {from: governorAddress});
    await this.core.grantMinter(this.pcvController.address, {from: governorAddress});

    await this.fei.mint(this.pair.address, 50000000, {from: minterAddress});
  });

  describe('Sole LP', function() {
    beforeEach(async function() {
      await this.token.mint(this.pcvDeposit.address, 100000);
      await this.pcvController.forceReweight({from: guardianAddress});
    });
    it('pcvDeposit gets all tokens', async function() {
      expect(await this.pcvDeposit.balance()).to.be.bignumber.equal(new BN(100000));
      expect(await balance.current(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
    });
  });

  describe('With Other LP', function() {
    describe('At peg', function() {
      beforeEach(async function() {
        await this.token.mint(this.pcvDeposit.address, 100000);
        await this.pair.set(100000, 50000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 500:1 FEI/token with 10k liquidity
      });

      it('reverts', async function() {
        await expectRevert(this.pcvController.forceReweight({from: governorAddress}), "UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT");
      });
    });

    describe('Above peg', function() {
      beforeEach(async function() {
        await this.token.mint(this.pcvDeposit.address, 100000);
        await this.token.mint(this.pair.address, 100000);
        await this.pair.set(100000, 49000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 490:1 FEI/token with 10k liquidity
        expectEvent(
          await this.pcvController.forceReweight({from: guardianAddress}),
          'Reweight',
          { _caller: guardianAddress }
        );
      });  

      it('pair loses some tokens in swap', async function() {
        expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(98995));
      });

      it('pcvDeposit gets remaining tokens', async function() {
        expect(await this.pcvDeposit.balance()).to.be.bignumber.equal(new BN(101005));
        expect(await this.token.balanceOf(this.pcvController.address)).to.be.bignumber.equal(new BN(0));
      });
    });

    describe('Below peg', function() {
      describe('Rebases', function() {
        beforeEach(async function() {
          await this.fei.mint(this.pair.address, 1000000, {from: minterAddress}); // top up to 51m
          await this.token.mint(this.pcvDeposit.address, 100000);
          await this.pair.set(100000, 51000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 490:1 FEI/token with 10k liquidity
          expectEvent(
            await this.pcvController.forceReweight({from: guardianAddress}),
            'Reweight',
            { _caller: guardianAddress }
          );
        });

        it('pair gets no token in swap', async function() {
          expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(0));
        });
        it('pcvDeposit token value remains constant', async function() {
          expect(await this.pcvDeposit.balance()).to.be.bignumber.equal(new BN(100000));
        });
        it('pair FEI balance rebases', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(50000000));
        });
      });
    });
    
    describe('Oracle Update', function() {
      beforeEach(async function() {
        await this.token.mint(this.pcvDeposit.address, 100000);
        await this.oracle.setExchangeRate(400);
        await this.fei.mint(this.pair.address, 1000000, {from: minterAddress}); // top up to 51m
        await this.pair.set(100000, 51000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 490:1 FEI/token with 10k liquidity
        expectEvent(
          await this.pcvController.forceReweight({from: guardianAddress}),
          'Reweight',
          { _caller: guardianAddress }
        );
      });

      it('pair gets no token in swap', async function() {
        expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(0));
      });
      it('pcvDeposit token value remains constant', async function() {
        expect(await this.pcvDeposit.balance()).to.be.bignumber.equal(new BN(100000));
      });
      it('pair FEI balance rebases', async function() {
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(40000000));
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

    describe('Not yet at time', function () {
      beforeEach(async function() {
        await this.token.mint(this.pair.address, 100000);
        await this.pair.set(100000, 51000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 510:1 FEI/token with 10k liquidity
      });

      it('reverts', async function() {
        expect(await this.pcvController.isTimeEnded()).to.be.equal(false);
        expect(await this.pcvController.reweightEligible()).to.be.equal(false);
        await expectRevert(this.pcvController.reweight(), "UniswapPCVController: Not passed reweight time or not at min distance");
      })

      describe('After time period passes', function() {
        beforeEach(async function() {
          await time.increase(new BN('14400'));
        });

        it('Reweight eligible', async function() {
          expect(await this.pcvController.isTimeEnded()).to.be.equal(true);
          expect(await this.pcvController.reweightEligible()).to.be.equal(true);
        });

        describe('After Reweight', function() {
          beforeEach(async function() {
            await this.token.mint(this.pcvDeposit.address, 100000);
            await this.pcvController.reweight({from: userAddress});
          });
          it('timer resets', async function() {
            expect(await this.pcvController.isTimeEnded()).to.be.equal(false);
            expect(await this.pcvController.reweightEligible()).to.be.equal(false);
          });
        });
      });
    });

    describe('Not at min distance', function () {
      it('reverts', async function() {
        await this.token.mint(this.pair.address, 100000);
        await this.pair.set(100000, 50400000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 504:1 FEI/token with 10k liquidity
        await time.increase(new BN('14400'));

        expect(await this.pcvController.reweightEligible()).to.be.equal(false);
        await expectRevert(this.pcvController.reweight(), "UniswapPCVController: Not passed reweight time or not at min distance");
      })
    });

    describe('Above peg', function() {
      beforeEach(async function() {
        await this.fei.burnFrom(this.pair.address, 1000000, {from: burnerAddress}); // burn down to 49m
        await this.token.mint(this.pcvDeposit.address, 100000);
        await this.token.mint(this.pair.address, 100000);
        await this.pair.set(100000, 49000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 490:1 FEI/token with 10k liquidity
        await time.increase(new BN('14400'));
        expect(await this.pcvController.reweightEligible()).to.be.equal(true);
        await this.pcvController.reweight({from: userAddress});
      });

      it('pair loses some tokens in swap', async function() {
        expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(98995));
      });
      it('pcvDeposit tokens value goes up', async function() {
        expect(await this.pcvDeposit.balance()).to.be.bignumber.equal(new BN(101005));
      });
      it('pair FEI balance rebases', async function() {
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(49498970));
      });
    });

    describe('No incentive for caller if controller not minter', function() {
        beforeEach(async function() {
          await this.fei.mint(this.pair.address, 1000000, {from: minterAddress}); // top up to 51m
          await this.token.mint(this.pcvDeposit.address, 100000);
          await this.pair.set(100000, 51000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 510:1 FEI/token with 10k liquidity
          await time.increase(new BN('14400'));
          await this.core.revokeMinter(this.pcvController.address, {from: governorAddress});     
          expect(await this.pcvController.reweightEligible()).to.be.equal(true);
          await this.pcvController.reweight({from: userAddress});
        });

        it('pair gets no tokens in swap', async function() {
          expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(0));
        });
        it('pcvDeposit tokens value remains constant', async function() {
          expect(await this.pcvDeposit.balance()).to.be.bignumber.equal(new BN(100000));
        });
        it('pair FEI balance rebases', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(50000000));
        });
    });

    describe('Incentive for caller if controller is a minter', function() {
        beforeEach(async function() {
          await this.fei.mint(this.pair.address, 1000000, {from: minterAddress}); // top up to 51m
          await this.token.mint(this.pcvDeposit.address, 100000);
          await this.pair.set(100000, 51000000, LIQUIDITY_INCREMENT, {from: userAddress, value: 100000}); // 490:1 FEI/token with 10k liquidity
          await time.increase(new BN('14400'));
          await this.core.grantMinter(this.pcvController.address, {from: governorAddress});     
          expect(await this.pcvController.reweightEligible()).to.be.equal(true);
          await this.pcvController.reweight({from: userAddress});
        });

        it('pair gets no tokens in swap', async function() {
          expect(await this.token.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(0));
        });
        it('pcvDeposit token value remains constant', async function() {
          expect(await this.pcvDeposit.balance()).to.be.bignumber.equal(new BN(100000));
        });
        it('pair FEI balance rebases', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(50000000));
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

    describe('Duration', function() {
      it('Governor set succeeds', async function() {
        await this.pcvController.setDuration(10, {from: governorAddress});
        expect(await this.pcvController.duration()).to.be.bignumber.equal('10');
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.pcvController.setDuration('10', {from: userAddress}), "CoreRef: Caller is not a governor");
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