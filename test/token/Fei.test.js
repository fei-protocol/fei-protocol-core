const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Fei = contract.fromArtifact('Fei');
const MockCore = contract.fromArtifact('MockSettableCore');
const MockIncentive = contract.fromArtifact('MockIncentive');


describe('Fei', function () {
  const [ minterAddress, burnerAddress, userAddress, incentivizedAddress, operatorAddress ] = accounts;

  beforeEach(async function () {
    this.core = await MockCore.new();
    this.fei = await Fei.at(await this.core.fei());
    await this.core.grantMinter(minterAddress);
    await this.core.grantBurner(burnerAddress);
  });

  describe('mint', function () {
    describe('not from minter', function () {
      it('reverts', async function () {
        await expectRevert(this.fei.mint(userAddress, 100), "CoreRef: Caller is not a minter");
      });
    });

    describe('from minter', function () {
   	  beforeEach(async function () {
        const { logs } = await this.fei.mint(userAddress, 100, {from: minterAddress});
        this.logs = logs;
      });

      it('mints new Fei tokens', async function () {
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
      });

      it('emits Minting event', async function () {
        const event = expectEvent.inLogs(this.logs, 'Minting', {
          to: userAddress,
          minter: minterAddress
        });
        expect(event.args.amount).to.be.bignumber.equal(new BN(100));
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
      	await this.fei.mint(userAddress, 200, {from: minterAddress});
        const { logs } = await this.fei.burnFrom(userAddress, 100, {from: burnerAddress});
		    this.logs = logs;
      });

      it('burn Fei tokens', async function () {
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
      });

      it('emits Burning event', async function () {
        const event = expectEvent.inLogs(this.logs, 'Burning', {
          to: userAddress,
          burner: burnerAddress
        });
        expect(event.args.amount).to.be.bignumber.equal(new BN(100));
      });
    });
    describe('from burner to user without sufficient balance', function () {
      it('burn Fei tokens', async function () {
        await expectRevert(this.fei.burnFrom(userAddress, 100, {from: burnerAddress}), "ERC20: burn amount exceeds balance");
      });
    });
  });

  describe('incentives', function() {
  	beforeEach(async function () {
  		this.incentive = await MockIncentive.new(this.core.address);
    	await this.core.grantMinter(this.incentive.address);
    	await this.fei.setIncentiveContract(incentivizedAddress, this.incentive.address);
    });

    it('incentive contract registered', async function() {
        expect(await this.fei.incentives(incentivizedAddress)).to.be.bignumber.equal(this.incentive.address);
    });

  	describe('via transfer', function() {
  		describe('on sender', function() {
  		  beforeEach(async function () {
  		  	await this.fei.mint(incentivizedAddress, 200, {from: minterAddress});
  			  const { logs } = await this.fei.transfer(userAddress, 200, {from: incentivizedAddress});
  			  this.logs = logs;
    	  });

    	  it('balances update', async function() {
        	expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(200));
    	  });

        it('incentive applied', async function() {
          expect(await this.fei.balanceOf(incentivizedAddress)).to.be.bignumber.equal(new BN(100));
        });

    	  it('emits Incentive event', async function () {
	        const event = expectEvent.inLogs(this.logs, 'Incentive', {
	          on: incentivizedAddress,
	          incentiveContract: this.incentive.address,
	          sender: incentivizedAddress,
	          recipient: userAddress,
	          transferAmount: new BN(200)
	        });
      	});
  		});
  		describe('on receiver', function() {
  		  beforeEach(async function () {
  		  	await this.fei.mint(userAddress, 200, {from: minterAddress});
  			  const { logs } = await this.fei.transfer(incentivizedAddress, 200, {from: userAddress});
  			  this.logs = logs;
    	  });

    	  it('balances update', async function() {
        	expect(await this.fei.balanceOf(incentivizedAddress)).to.be.bignumber.equal(new BN(200));
    	  });

        it('incentive applied', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
        });

    	  it('emits Incentive event', async function () {
	        const event = expectEvent.inLogs(this.logs, 'Incentive', {
	          on: incentivizedAddress,
	          incentiveContract: this.incentive.address,
	          sender: userAddress,
	          recipient: incentivizedAddress,
	          transferAmount: new BN(200)
	        });
      	});
  		});
  		describe('on all', function() {
  		  beforeEach(async function () {
  		  	await this.fei.mint(userAddress, 200, {from: minterAddress});
  		  	// Set all incentive
  		  	await this.fei.setIncentiveContract(ZERO_ADDRESS, this.incentive.address);
  		  	// unset incentive
  		  	await this.fei.setIncentiveContract(incentivizedAddress, ZERO_ADDRESS);

  			  const { logs } = await this.fei.transfer(incentivizedAddress, 200, {from: userAddress});
  			  this.logs = logs;
    	  });

    	  it('balances update', async function() {
        	expect(await this.fei.balanceOf(incentivizedAddress)).to.be.bignumber.equal(new BN(200));
    	  });

        it('incentive applied', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
        });

    	  it('emits Incentive event', async function () {
	        const event = expectEvent.inLogs(this.logs, 'Incentive', {
	          on: ZERO_ADDRESS,
	          incentiveContract: this.incentive.address,
	          sender: userAddress,
	          recipient: incentivizedAddress,
	          transferAmount: new BN(200)
	        });
      	});
  		});
  		describe('on sender and receiver', function() {

  		  beforeEach(async function () {
  		  	await this.fei.mint(userAddress, 200, {from: minterAddress});
  		  	// Set incentive on user
  		  	await this.fei.setIncentiveContract(userAddress, this.incentive.address);

  			  const { logs } = await this.fei.transfer(incentivizedAddress, 200, {from: userAddress});
  			  this.logs = logs;
    	  });

    	  it('balances update', async function() {
        	expect(await this.fei.balanceOf(incentivizedAddress)).to.be.bignumber.equal(new BN(200));
    	  });

        it('incentive applied', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(200));
        });

    	  it('emits Incentive event twice', async function () {
	        expectEvent.inLogs(this.logs, 'Incentive', {
	          on: incentivizedAddress,
	          incentiveContract: this.incentive.address,
	          sender: userAddress,
	          recipient: incentivizedAddress,
	          transferAmount: new BN(200)
	        });
	        expectEvent.inLogs(this.logs, 'Incentive', {
	          on: userAddress,
	          incentiveContract: this.incentive.address,
	          sender: userAddress,
	          recipient: incentivizedAddress,
	          transferAmount: new BN(200)
	        });
      	});
  		});
  		describe('on receiver and all', function() {
  		  beforeEach(async function () {
  		  	await this.fei.mint(userAddress, 200, {from: minterAddress});
  		  	// Set incentive on zero address
  		  	await this.fei.setIncentiveContract(ZERO_ADDRESS, this.incentive.address);

  			  const { logs } = await this.fei.transfer(incentivizedAddress, 200, {from: userAddress});
  			  this.logs = logs;
    	  });

    	  it('balances update', async function() {
        	expect(await this.fei.balanceOf(incentivizedAddress)).to.be.bignumber.equal(new BN(200));
    	  });

        it('incentive applied', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(200));
        });

    	  it('emits Incentive event twice', async function () {
	        expectEvent.inLogs(this.logs, 'Incentive', {
	          on: ZERO_ADDRESS,
	          incentiveContract: this.incentive.address,
	          sender: userAddress,
	          recipient: incentivizedAddress,
	          transferAmount: new BN(200)
	        });
	        expectEvent.inLogs(this.logs, 'Incentive', {
	          on: incentivizedAddress,
	          incentiveContract: this.incentive.address,
	          sender: userAddress,
	          recipient: incentivizedAddress,
	          transferAmount: new BN(200)
	        });
  		  });
  	  });
  	});
 	describe('via transferFrom', function() {
  		describe('on operator', function() {
  		  beforeEach(async function () {
  		  	await this.fei.mint(userAddress, 200, {from: minterAddress});
  		  	await this.fei.approve(operatorAddress, 200, {from: userAddress});
  		  	// Set incentive on operator
  		  	await this.fei.setIncentiveContract(operatorAddress, this.incentive.address);
  		  	// Unset incentive on incentivizedAddress
  		  	await this.fei.setIncentiveContract(incentivizedAddress, ZERO_ADDRESS);

  			  const { logs } = await this.fei.transferFrom(userAddress, incentivizedAddress, 200, {from: operatorAddress});
  			  this.logs = logs;
    	  });

    	  it('balances update', async function() {
        	expect(await this.fei.balanceOf(incentivizedAddress)).to.be.bignumber.equal(new BN(200));
    	  });

        it('incentive applied', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
        });

    	  it('operator approval decrements', async function() {
    	  	expect(await this.fei.allowance(userAddress, operatorAddress)).to.be.bignumber.equal(new BN(0));
    	  });

    	  it('emits Incentive event', async function () {
	        expectEvent.inLogs(this.logs, 'Incentive', {
	          on: operatorAddress,
	          incentiveContract: this.incentive.address,
	          sender: userAddress,
	          recipient: incentivizedAddress,
	          transferAmount: new BN(200)
	        });
      	});
  		});
  		describe('on sender and operator', function() {
  		  beforeEach(async function () {
  		  	await this.fei.mint(incentivizedAddress, 200, {from: minterAddress});
  		  	await this.fei.approve(operatorAddress, 200, {from: incentivizedAddress});
  		  	// Set incentive on operator
  		  	await this.fei.setIncentiveContract(operatorAddress, this.incentive.address);

  			  const { logs } = await this.fei.transferFrom(incentivizedAddress, userAddress, 200, {from: operatorAddress});
  			  this.logs = logs;
    	  });

    	  it('balances update', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(200));
    	  });

        it('incentive applied', async function() {
          expect(await this.fei.balanceOf(incentivizedAddress)).to.be.bignumber.equal(new BN(200));
        });

    	  it('operator approval decrements', async function() {
    	  	expect(await this.fei.allowance(userAddress, operatorAddress)).to.be.bignumber.equal(new BN(0));
    	  });

    	  it('emits Incentive event twice', async function () {
	        expectEvent.inLogs(this.logs, 'Incentive', {
	          on: operatorAddress,
	          incentiveContract: this.incentive.address,
	          sender: incentivizedAddress,
	          recipient: userAddress,
	          transferAmount: new BN(200)
	        });
	        expectEvent.inLogs(this.logs, 'Incentive', {
	          on: incentivizedAddress,
	          incentiveContract: this.incentive.address,
	          sender: incentivizedAddress,
	          recipient: userAddress,
	          transferAmount: new BN(200)
	        });
      	});
  		});

  		describe('on operator and all', function() {
  	    beforeEach(async function () {
  		  	await this.fei.mint(userAddress, 200, {from: minterAddress});
  		  	await this.fei.approve(operatorAddress, 200, {from: userAddress});
  		  	// Set incentive on operator
  		  	await this.fei.setIncentiveContract(operatorAddress, this.incentive.address);
  		  	// Unset incentive on incentivizedAddress
  		  	await this.fei.setIncentiveContract(incentivizedAddress, ZERO_ADDRESS);
  		  	// Set incentive on all 
  		  	await this.fei.setIncentiveContract(ZERO_ADDRESS, this.incentive.address);

  			  const { logs } = await this.fei.transferFrom(userAddress, incentivizedAddress, 200, {from: operatorAddress});
  			  this.logs = logs;
    	  });

    	  it('balances update', async function() {
        	expect(await this.fei.balanceOf(incentivizedAddress)).to.be.bignumber.equal(new BN(200));
    	  });

        it('incentive applied', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(200));
        });

    	  it('operator approval decrements', async function() {
    	  	expect(await this.fei.allowance(userAddress, operatorAddress)).to.be.bignumber.equal(new BN(0));
    	  });

    	  it('emits Incentive event twice', async function () {
	        expectEvent.inLogs(this.logs, 'Incentive', {
	          on: operatorAddress,
	          incentiveContract: this.incentive.address,
	          sender: userAddress,
	          recipient: incentivizedAddress,
	          transferAmount: new BN(200)
	        });
	        expectEvent.inLogs(this.logs, 'Incentive', {
	          on: ZERO_ADDRESS,
	          incentiveContract: this.incentive.address,
	          sender: userAddress,
	          recipient: incentivizedAddress,
	          transferAmount: new BN(200)
	        });
      	});
  		});
  	});
  });
});