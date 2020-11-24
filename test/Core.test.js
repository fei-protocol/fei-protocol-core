const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockCoreRef = contract.fromArtifact('MockCoreRef');
const Core = contract.fromArtifact('Core');

describe('Core', function () {
  const [ userAddress, minterAddress, burnerAddress, governorAddress, reclaimerAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({gas: 8000000});
    this.coreRef = await MockCoreRef.new(this.core.address);
    await this.core.grantMinter(minterAddress);
    await this.core.grantBurner(burnerAddress);
    await this.core.grantGovernor(governorAddress);
    await this.core.grantReclaimer(reclaimerAddress);
  });

  describe('Minter', function () {
  	describe('Role', function () {
  		describe('Has access', function () {
			it('is registered in core', async function() {
				expect(await this.core.isMinter(minterAddress)).to.be.equal(true);
			});
  		});
  		describe('Access revoked', function () {
  			beforeEach(async function() {
  				await this.core.revokeMinter(minterAddress, {from: governorAddress});
  			});

			it('is not registered in core', async function() {
				expect(await this.core.isMinter(minterAddress)).to.be.equal(false);
			});
  		});
  	});
  	describe('Access', function () {
		it('onlyMinter succeeds', async function() {
			await this.coreRef.testMinter({from: minterAddress});
		});

		it('onlyBurner reverts', async function() {
			await expectRevert(this.coreRef.testBurner({from: minterAddress}), "CoreRef: Caller is not a burner");
		});

		it('onlyGovernor reverts', async function() {
			await expectRevert(this.coreRef.testGovernor({from: minterAddress}), "CoreRef: Caller is not a governor");
		});

		it('onlyReclaimer reverts', async function() {
			await expectRevert(this.coreRef.testReclaimer({from: minterAddress}), "CoreRef: Caller is not a reclaimer");
		});
  	});
  });

  describe('Burner', function () {
  	describe('Role', function () {
  		describe('Has access', function () {
			it('is registered in core', async function() {
				expect(await this.core.isBurner(burnerAddress)).to.be.equal(true);
			});
  		});
  		describe('Access revoked', function () {
  			beforeEach(async function() {
  				await this.core.revokeBurner(burnerAddress, {from: governorAddress});
  			});

			it('is not registered in core', async function() {
				expect(await this.core.isBurner(burnerAddress)).to.be.equal(false);
			});
  		});
  	});
  	describe('Access', function () {
		it('onlyMinter reverts', async function() {
			await expectRevert(this.coreRef.testMinter({from: burnerAddress}), "CoreRef: Caller is not a minter");
		});

		it('onlyBurner succeeds', async function() {
			await this.coreRef.testBurner({from: burnerAddress});
		});

		it('onlyGovernor reverts', async function() {
			await expectRevert(this.coreRef.testGovernor({from: burnerAddress}), "CoreRef: Caller is not a governor");
		});

		it('onlyReclaimer reverts', async function() {
			await expectRevert(this.coreRef.testReclaimer({from: burnerAddress}), "CoreRef: Caller is not a reclaimer");
		});
  	});
  });

  describe('Reclaimer', function () {
  	describe('Role', function () {
  		describe('Has access', function () {
			it('is registered in core', async function() {
				expect(await this.core.isReclaimer(reclaimerAddress)).to.be.equal(true);
			});
  		});
  		describe('Access revoked', function () {
  			beforeEach(async function() {
  				await this.core.revokeReclaimer(reclaimerAddress, {from: governorAddress});
  			});

			it('is not registered in core', async function() {
				expect(await this.core.isReclaimer(reclaimerAddress)).to.be.equal(false);
			});
  		});
  	});
  	describe('Access', function () {
		it('onlyMinter reverts', async function() {
			await expectRevert(this.coreRef.testMinter({from: reclaimerAddress}), "CoreRef: Caller is not a minter");
		});

		it('onlyBurner reverts', async function() {
			await expectRevert(this.coreRef.testBurner({from: reclaimerAddress}), "CoreRef: Caller is not a burner");
		});

		it('onlyGovernor reverts', async function() {
			await expectRevert(this.coreRef.testGovernor({from: reclaimerAddress}), "CoreRef: Caller is not a governor");
		});

		it('onlyReclaimer succeeds', async function() {
			await this.coreRef.testReclaimer({from: reclaimerAddress});
		});
  	});
  });

  describe('Governor', function () {
  	describe('Role', function () {
  		describe('Has access', function () {
			it('is registered in core', async function() {
				expect(await this.core.isGovernor(governorAddress)).to.be.equal(true);
			});
  		});
  		describe('Access revoked', function () {
  			beforeEach(async function() {
  				await this.core.revokeGovernor(governorAddress, {from: governorAddress});
  			});

			it('is not registered in core', async function() {
				expect(await this.core.isGovernor(governorAddress)).to.be.equal(false);
			});
  		});
  	});
  	describe('Access', function () {
		it('onlyMinter reverts', async function() {
			await expectRevert(this.coreRef.testMinter({from: governorAddress}), "CoreRef: Caller is not a minter");
		});

		it('onlyBurner reverts', async function() {
			await expectRevert(this.coreRef.testBurner({from: governorAddress}), "CoreRef: Caller is not a burner");
		});

		it('onlyGovernor succeeds', async function() {
			await this.coreRef.testGovernor({from: governorAddress});
		});

		it('onlyReclaimer reverts', async function() {
			await expectRevert(this.coreRef.testReclaimer({from: governorAddress}), "CoreRef: Caller is not a reclaimer");
		});
  	});

  	describe('Access Control', function () {
  		describe('Minter', function() {

  		});
  	});
  });
});