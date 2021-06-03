

const {
    userAddress, 
    governorAddress, 
    minterAddress, 
    pcvControllerAddress,
    BN,
    expectRevert,
    expect,
    contract,
    getCore
  } = require('../helpers');
  
const TribeReserveStabilizer = contract.fromArtifact('TribeReserveStabilizer');
const Fei = contract.fromArtifact('Fei');
const Tribe = contract.fromArtifact('Tribe');
const MockOracle = contract.fromArtifact('MockOracle');
const MockPCVDeposit = contract.fromArtifact('MockEthUniswapPCVDeposit');

  describe('TribeReserveStabilizer', function () {
  
    beforeEach(async function () {
      this.core = await getCore(true);
  
      this.fei = await Fei.at(await this.core.fei());
      this.tribe = await Tribe.at(await this.core.tribe());
      this.oracle = await MockOracle.new(400); // 400:1 oracle price
      this.feiOracle = await MockOracle.new(1);
      this.pcvDeposit = await MockPCVDeposit.new(userAddress);

      this.reserveStabilizer = await TribeReserveStabilizer.new(this.core.address, this.oracle.address, '9000', this.feiOracle.address, '10000');

      await this.core.grantBurner(this.reserveStabilizer.address, {from: governorAddress});

      await this.tribe.setMinter(this.reserveStabilizer.address, {from: governorAddress});

      await this.fei.mint(userAddress, 40000000, {from: minterAddress});  
    });
  
    describe('Exchange', function() {
      describe('Enough FEI', function() {
        it('exchanges for appropriate amount of token', async function() {
          let userBalanceBefore = await this.tribe.balanceOf(userAddress);
          await this.reserveStabilizer.exchangeFei(40000000, {from: userAddress});
          let userBalanceAfter = await this.tribe.balanceOf(userAddress);

          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.bignumber.equal(new BN('90000'));

          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
          expect(await this.reserveStabilizer.balance()).to.be.bignumber.equal(new BN('0'));
        });
      });

      describe('Double Oracle price', function() {
        it('exchanges for appropriate amount of token', async function() {
          await this.oracle.setExchangeRate('800');

          let userBalanceBefore = await this.tribe.balanceOf(userAddress);
          await this.reserveStabilizer.exchangeFei(40000000, {from: userAddress});
          let userBalanceAfter = await this.tribe.balanceOf(userAddress);

          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.bignumber.equal(new BN('45000'));

          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
          expect(await this.reserveStabilizer.balance()).to.be.bignumber.equal(new BN('0'));
        });
      });
  
      describe('Higher usd per fei', function() {
        it('exchanges for appropriate amount of token', async function() {
          await this.reserveStabilizer.setUsdPerFeiRate('9500', {from: governorAddress});

          let userBalanceBefore = await this.tribe.balanceOf(userAddress);
          await this.reserveStabilizer.exchangeFei(40000000, {from: userAddress});
          let userBalanceAfter = await this.tribe.balanceOf(userAddress);

          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.bignumber.equal(new BN('95000'));

          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
          expect(await this.reserveStabilizer.balance()).to.be.bignumber.equal(new BN('0'));
        });
      });

      describe('Not Enough FEI', function() {
        it('reverts', async function() {
          await expectRevert(this.reserveStabilizer.exchangeFei(50000000, {from: userAddress}), "ERC20: burn amount exceeds balance");
        });
      });

      describe('FEI above threshold', function() {
        it('reverts', async function() {
          await this.reserveStabilizer.setFeiPriceThreshold('9900', {from: governorAddress});
          await expectRevert(this.reserveStabilizer.exchangeFei(40000000, {from: userAddress}), "TribeReserveStabilizer: FEI price too high");
        });
      });

      describe('Paused', function() {
        it('reverts', async function() {
          await this.reserveStabilizer.pause({from: governorAddress});
          await expectRevert(this.reserveStabilizer.exchangeFei(new BN('400000'), {from: userAddress}), "Pausable: paused");
        });
      });
    });
  
    describe('isFeiBelowThreshold', function() {
      it('above', async function() {
        await this.reserveStabilizer.setFeiPriceThreshold('9900', {from: governorAddress});
        expect(await this.reserveStabilizer.isFeiBelowThreshold()).to.be.equal(false);
      });

      it('at', async function() {
        expect(await this.reserveStabilizer.isFeiBelowThreshold()).to.be.equal(true);
      });

      it('below', async function() {
        await this.reserveStabilizer.setFeiPriceThreshold('11000', {from: governorAddress});
        expect(await this.reserveStabilizer.isFeiBelowThreshold()).to.be.equal(true);
      });

      it('invalid oracle', async function() {
        await this.feiOracle.setValid(false);
        expect(await this.reserveStabilizer.isFeiBelowThreshold()).to.be.equal(false);
      });
    });

    describe('Withdraw', function() {
        it('reverts', async function() {
            await expectRevert(this.reserveStabilizer.withdraw(userAddress, '1000000000', {from: pcvControllerAddress}), "TribeReserveStabilizer: nothing to withdraw");
        });
    });

    describe('Mint', function() {
        it('governor succeeds', async function() {
          await this.reserveStabilizer.mint(userAddress, '10000', {from: governorAddress});
          expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN('10000'));
        });
  
        it('non-governor reverts', async function() {
          await expectRevert(this.reserveStabilizer.mint(userAddress, '10000', {from: userAddress}), "CoreRef: Caller is not a governor");
        });
    });

    describe('Set Minter', function() {
        it('governor succeeds', async function() {
          await this.reserveStabilizer.setMinter(userAddress, {from: governorAddress});
          expect(await this.tribe.minter()).to.be.equal(userAddress);
        });
  
        it('non-governor reverts', async function() {
          await expectRevert(this.reserveStabilizer.setMinter(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
        });
    });

    describe('Set USD per FEI', function() {
      it('governor succeeds', async function() {
        await this.reserveStabilizer.setUsdPerFeiRate('10000', {from: governorAddress});
        expect(await this.reserveStabilizer.usdPerFeiBasisPoints()).to.be.bignumber.equal(new BN('10000'));
      });

      it('non-governor reverts', async function() {
        await expectRevert(this.reserveStabilizer.setUsdPerFeiRate('10000', {from: userAddress}), "CoreRef: Caller is not a governor");
      });

      it('too high usd per fei reverts', async function() {
        await expectRevert(this.reserveStabilizer.setUsdPerFeiRate('10001', {from: governorAddress}), "ReserveStabilizer: Exceeds bp granularity");
      });
    });
  });