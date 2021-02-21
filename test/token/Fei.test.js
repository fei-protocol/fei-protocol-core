const {
	minterAddress,
	burnerAddress,
	userAddress,
	ZERO_ADDRESS,
	BN, 
	expectEvent,
	expectRevert,
	expect,
	Fei,
  MockIncentive,
  MockIncentivized,
	getCore,
	governorAddress
} = require('../helpers');

describe('Fei', function () {

  beforeEach(async function () {
    this.core = await getCore(true);
    this.fei = await Fei.at(await this.core.fei());
  });

  describe('mint', function () {
    describe('not from minter', function () {
      it('reverts', async function () {
        await expectRevert(this.fei.mint(userAddress, 100), "CoreRef: Caller is not a minter");
      });
    });

    describe('from minter', function () {
      beforeEach(async function () {
        expectEvent(
          await this.fei.mint(userAddress, 100, { from: minterAddress }),
          'Minting',
          {
            _to: userAddress,
            _minter: minterAddress,
            _amount: '100'
          }
        );
      });

      it('mints new Fei tokens', async function () {
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
      });
    });
  });

  describe('burn', function () {
    describe('not from burner', function () {
      it('reverts', async function () {
        await expectRevert(this.fei.burnFrom(userAddress, 100), "CoreRef: Caller is not a burner");
      });
    });

    describe('from burner to user with sufficient balance', function () {
      beforeEach(async function () {
        await this.fei.mint(userAddress, 200, { from: minterAddress });
        expectEvent(
          await this.fei.burnFrom(userAddress, 100, { from: burnerAddress }),
          'Burning',
          {
            _to: userAddress,
            _burner: burnerAddress,
            _amount: '100'
          }
        );
      });

      it('burn Fei tokens', async function () {
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
      });
    });
    describe('from burner to user without sufficient balance', function () {
      it('burn Fei tokens', async function () {
        await expectRevert(this.fei.burnFrom(userAddress, 100, { from: burnerAddress }), "ERC20: burn amount exceeds balance");
      });
    });
  });

  describe('incentive contracts', function () {
    beforeEach(async function () {
      this.incentive = await MockIncentive.new(this.core.address);
      this.incentivizedContract = await MockIncentivized.new(this.core.address);
      this.incentivizedAddress = this.incentivizedContract.address;
      await this.core.grantMinter(this.incentive.address, {from: governorAddress});
      expectEvent(
        await this.fei.setIncentiveContract(this.incentivizedAddress, this.incentive.address, {from: governorAddress}),
        'IncentiveContractUpdate',
        {
          _incentivized: this.incentivizedAddress,
          _incentiveContract: this.incentive.address
        }
      );
    });

    it('incentive contract registered', async function () {
      expect(await this.fei.incentiveContract(this.incentivizedAddress)).to.be.bignumber.equal(this.incentive.address);
    });

    it('non-contract reverts', async function() {
      await expectRevert(this.fei.setIncentiveContract(userAddress, this.incentive.address, {from: governorAddress}), "Fei: incentivized is not a contract");
    });

    describe('via transfer', function () {
      describe('on sender', function () {
        beforeEach(async function () {
          await this.fei.mint(this.incentivizedAddress, 200, { from: minterAddress });
          const { logs } = await this.incentivizedContract.sendFei(userAddress, 200);
          this.logs = logs;
        });

        it('balances update', async function () {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(200));
        });

        it('incentive applied', async function () {
          expect(await this.fei.balanceOf(this.incentivizedAddress)).to.be.bignumber.equal(new BN(100));
        });
      });
      describe('on receiver', function () {
        beforeEach(async function () {
          await this.fei.mint(userAddress, 200, { from: minterAddress });
          const { logs } = await this.fei.transfer(this.incentivizedAddress, 200, { from: userAddress });
          this.logs = logs;
        });

        it('balances update', async function () {
          expect(await this.fei.balanceOf(this.incentivizedAddress)).to.be.bignumber.equal(new BN(200));
        });

        it('incentive applied', async function () {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
        });
      });
      describe('on all', function () {
        beforeEach(async function () {
          await this.fei.mint(userAddress, 200, { from: minterAddress });
          // Set all incentive
          await this.fei.setIncentiveContract(ZERO_ADDRESS, this.incentive.address, {from: governorAddress});
          // unset incentive
          await this.fei.setIncentiveContract(this.incentivizedAddress, ZERO_ADDRESS, {from: governorAddress});

          const { logs } = await this.fei.transfer(this.incentivizedAddress, 200, { from: userAddress });
          this.logs = logs;
        });

        it('balances update', async function () {
          expect(await this.fei.balanceOf(this.incentivizedAddress)).to.be.bignumber.equal(new BN(200));
        });

        it('incentive applied', async function () {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
        });
      });
      describe('on sender and receiver', function () {

        beforeEach(async function () {
          await this.fei.mint(this.incentivizedAddress, 200, { from: minterAddress });
          const { logs } = await this.incentivizedContract.sendFei(this.incentivizedAddress, 200);
          this.logs = logs;
        });

        it('balances update with incentives', async function () {
          expect(await this.fei.balanceOf(this.incentivizedAddress)).to.be.bignumber.equal(new BN(400)); // infinite FEI ;)
        });
      });
      describe('on receiver and all', function () {
        beforeEach(async function () {
          await this.fei.mint(userAddress, 200, { from: minterAddress });
          // Set incentive on zero address
          await this.fei.setIncentiveContract(ZERO_ADDRESS, this.incentive.address, {from: governorAddress});

          const { logs } = await this.fei.transfer(this.incentivizedAddress, 200, { from: userAddress });
          this.logs = logs;
        });

        it('balances update', async function () {
          expect(await this.fei.balanceOf(this.incentivizedAddress)).to.be.bignumber.equal(new BN(200));
        });

        it('incentive applied', async function () {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(200));
        });
      });
    });
    describe('via transferFrom', function () {
      beforeEach(async function() {
        this.operator = await MockIncentivized.new(this.core.address);
        this.operatorAddress = this.operator.address;
      });

      describe('on operator', function () {
        beforeEach(async function () {
          await this.fei.mint(userAddress, 200, { from: minterAddress });
          await this.fei.approve(this.operatorAddress, 200, { from: userAddress });
          // Set incentive on operator
          await this.fei.setIncentiveContract(this.operatorAddress, this.incentive.address, {from: governorAddress});
          // Unset incentive on this.incentivizedAddress
          await this.fei.setIncentiveContract(this.incentivizedAddress, ZERO_ADDRESS, {from: governorAddress});

          const { logs } = await this.operator.sendFeiFrom(userAddress, this.incentivizedAddress, 200);
          
          this.logs = logs;
        });

        it('balances update', async function () {
          expect(await this.fei.balanceOf(this.incentivizedAddress)).to.be.bignumber.equal(new BN(200));
        });

        it('incentive applied', async function () {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
        });

        it('operator approval decrements', async function () {
          expect(await this.fei.allowance(userAddress, this.operatorAddress)).to.be.bignumber.equal(new BN(0));
        });
      });
      describe('on sender and operator', function () {
        beforeEach(async function () {
          await this.fei.mint(this.incentivizedAddress, 200, { from: minterAddress });
          this.incentivizedContract.approve(this.operatorAddress);
          // Set incentive on operator
          await this.fei.setIncentiveContract(this.operatorAddress, this.incentive.address, {from: governorAddress});

          const { logs } = await this.operator.sendFeiFrom(this.incentivizedAddress, userAddress, 200);

          this.logs = logs;
        });

        it('balances update', async function () {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(200));
        });

        it('incentive applied', async function () {
          expect(await this.fei.balanceOf(this.incentivizedAddress)).to.be.bignumber.equal(new BN(200));
        });
      });

      describe('on operator and all', function () {
        beforeEach(async function () {
          await this.fei.mint(userAddress, 200, { from: minterAddress });
          await this.fei.approve(this.operatorAddress, 200, { from: userAddress });
          // Set incentive on operator
          await this.fei.setIncentiveContract(this.operatorAddress, this.incentive.address, {from: governorAddress});
          // Unset incentive on this.incentivizedAddress
          await this.fei.setIncentiveContract(this.incentivizedAddress, ZERO_ADDRESS, {from: governorAddress});
          // Set incentive on all 
          await this.fei.setIncentiveContract(ZERO_ADDRESS, this.incentive.address, {from: governorAddress});

          const { logs } = await this.operator.sendFeiFrom(userAddress, this.incentivizedAddress, 200);
          this.logs = logs;
        });

        it('balances update', async function () {
          expect(await this.fei.balanceOf(this.incentivizedAddress)).to.be.bignumber.equal(new BN(200));
        });

        it('incentive applied', async function () {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(200));
        });

        it('operator approval decrements', async function () {
          expect(await this.fei.allowance(userAddress, this.operatorAddress)).to.be.bignumber.equal(new BN(0));
        });
      });
    });
  });
});