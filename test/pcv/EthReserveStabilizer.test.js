

const {
    userAddress, 
    governorAddress, 
    minterAddress, 
    pcvControllerAddress,
    web3,
    BN,
    expectRevert,
    balance,
    expect,
    EthReserveStabilizer,
    MockPCVDeposit,
    Fei,
    MockOracle,
    getCore
  } = require('../helpers');
  
  describe('EthReserveStabilizer', function () {
  
    beforeEach(async function () {
      this.core = await getCore(true);
  
      this.fei = await Fei.at(await this.core.fei());
      this.oracle = await MockOracle.new(400); // 400:1 oracle price
      this.pcvDeposit = await MockPCVDeposit.new(userAddress);

      this.reserveStabilizer = await EthReserveStabilizer.new(this.core.address, this.oracle.address, '9000');

      await this.core.grantBurner(this.reserveStabilizer.address, {from: governorAddress});

      await web3.eth.sendTransaction({from: userAddress, to: this.reserveStabilizer.address, value: "1000000000000000000"});

      await this.fei.mint(userAddress, 40000000, {from: minterAddress});  
    });
  
    describe('Exchange', function() {
      describe('Enough FEI', function() {
        it('exchanges for appropriate amount of ETH', async function() {
          let reserveBalanceBefore = await balance.current(this.reserveStabilizer.address);
          await this.reserveStabilizer.exchangeFeiForEth(40000000, {from: userAddress});
          let reserveBalanceAfter = await balance.current(this.reserveStabilizer.address);

          expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.bignumber.equal(new BN('90000'));

          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        });
      });

      describe('Double Oracle price', function() {
        it('exchanges for appropriate amount of ETH', async function() {
          await this.oracle.setExchangeRate('800');

          let reserveBalanceBefore = await balance.current(this.reserveStabilizer.address);
          await this.reserveStabilizer.exchangeFeiForEth(40000000, {from: userAddress});
          let reserveBalanceAfter = await balance.current(this.reserveStabilizer.address);

          expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.bignumber.equal(new BN('45000'));

          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        });
      });
  
      describe('Higher usd per fei', function() {
        it('exchanges for appropriate amount of ETH', async function() {
          await this.reserveStabilizer.setUsdPerFeiRate('9500', {from: governorAddress});

          let reserveBalanceBefore = await balance.current(this.reserveStabilizer.address);
          await this.reserveStabilizer.exchangeFeiForEth(40000000, {from: userAddress});
          let reserveBalanceAfter = await balance.current(this.reserveStabilizer.address);

          expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.bignumber.equal(new BN('95000'));

          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        });
      });

      describe('Not Enough FEI', function() {
        it('reverts', async function() {
          await expectRevert(this.reserveStabilizer.exchangeFeiForEth(50000000, {from: userAddress}), "ERC20: burn amount exceeds balance");
        });
      });

      describe('Not Enough ETH', function() {
        it('reverts', async function() {
          await this.fei.mint(userAddress, new BN('4000000000000000000000000000'), {from: minterAddress});  
          await expectRevert(this.reserveStabilizer.exchangeFeiForEth(new BN('4000000000000000000000000000'), {from: userAddress}), "revert");
        });
      });

      describe('Paused', function() {
        it('reverts', async function() {
          await this.reserveStabilizer.pause({from: governorAddress});
          await expectRevert(this.reserveStabilizer.exchangeFeiForEth(new BN('400000'), {from: userAddress}), "Pausable: paused");
        });
      });
    });
  
    describe('Withdraw', function() {
      it('enough eth succeeds', async function() {
        let reserveBalanceBefore = await balance.current(this.reserveStabilizer.address);
        let userBalanceBefore = await balance.current(userAddress);

        await this.reserveStabilizer.withdraw(userAddress, '10000', {from: pcvControllerAddress});
        let reserveBalanceAfter = await balance.current(this.reserveStabilizer.address);
        let userBalanceAfter = await balance.current(userAddress);

        expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.bignumber.equal(new BN('10000'));
        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.bignumber.equal(new BN('10000'));
      });

      it('not enough eth reverts', async function() {
        await expectRevert(this.reserveStabilizer.withdraw(userAddress, '10000000000000000000', {from: pcvControllerAddress}), "revert");
      });

      it('non pcvController', async function() {
        await expectRevert(this.reserveStabilizer.withdraw(userAddress, '10000', {from: userAddress}), "CoreRef: Caller is not a PCV controller");
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