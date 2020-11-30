const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockCoreRef = contract.fromArtifact('MockCoreRef');
const Core = contract.fromArtifact('Core');

describe('Core', function () {
  const [ userAddress, minterAddress, burnerAddress, governorAddress, pcvControllerAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({gas: 8000000, from: governorAddress});
    this.coreRef = await MockCoreRef.new(this.core.address);
    await this.core.grantMinter(minterAddress, {from: governorAddress});
    await this.core.grantBurner(burnerAddress, {from: governorAddress});
    await this.core.grantPCVController(pcvControllerAddress, {from: governorAddress});
    this.minterRole = await this.core.MINTER_ROLE();
    this.burnerRole = await this.core.BURNER_ROLE();
    this.governorRole = await this.core.GOVERN_ROLE();
    this.pcvControllerRole = await this.core.PCV_CONTROLLER_ROLE();
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
  		describe('Access renounced', function() {
  			beforeEach(async function() {
  				await this.core.renounceRole(this.minterRole, minterAddress, {from: minterAddress});
  			});

			it('is not registered in core', async function() {
				expect(await this.core.isMinter(minterAddress)).to.be.equal(false);
			});
  		});
  		describe('Member Count', function() {
  			it('is one', async function() {
  				expect(await this.core.getRoleMemberCount(this.minterRole)).to.be.bignumber.equal(new BN(1));
  			});
  			it('updates to two', async function() {
  				await this.core.grantMinter(userAddress, {from: governorAddress});
  				expect(await this.core.getRoleMemberCount(this.minterRole)).to.be.bignumber.equal(new BN(2));
  			});
  		});
  		describe('Admin', function() {
  			it('is governor', async function() {
  				expect(await this.core.getRoleAdmin(this.minterRole)).to.be.equal(this.governorRole);
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

  		it('onlyPCVController reverts', async function() {
  			await expectRevert(this.coreRef.testPCVController({from: minterAddress}), "CoreRef: Caller is not a PCV controller");
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
  		describe('Access renounced', function() {
  			beforeEach(async function() {
  				await this.core.renounceRole(this.burnerRole, burnerAddress, {from: burnerAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isBurner(burnerAddress)).to.be.equal(false);
  			});
  		});
  		describe('Member Count', function() {
  			it('is one', async function() {
  				expect(await this.core.getRoleMemberCount(this.burnerRole)).to.be.bignumber.equal(new BN(1));
  			});
  			it('updates to two', async function() {
  				await this.core.grantBurner(userAddress, {from: governorAddress});
  				expect(await this.core.getRoleMemberCount(this.burnerRole)).to.be.bignumber.equal(new BN(2));
  			});
  		});
  		describe('Admin', function() {
  			it('is governor', async function() {
  				expect(await this.core.getRoleAdmin(this.burnerRole)).to.be.equal(this.governorRole);
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

  		it('onlyPCVController reverts', async function() {
  			await expectRevert(this.coreRef.testPCVController({from: burnerAddress}), "CoreRef: Caller is not a PCV controller");
  		});
  	});
  });

  describe('PCV Controller', function () {
  	describe('Role', function () {
  		describe('Has access', function () {
  			it('is registered in core', async function() {
  				expect(await this.core.isPCVController(pcvControllerAddress)).to.be.equal(true);
  			});
  		});
  		describe('Access revoked', function () {
  			beforeEach(async function() {
  				await this.core.revokePCVController(pcvControllerAddress, {from: governorAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isPCVController(pcvControllerAddress)).to.be.equal(false);
  			});
  		});
  		describe('Access renounced', function() {
  			beforeEach(async function() {
  				await this.core.renounceRole(this.pcvControllerRole, pcvControllerAddress, {from: pcvControllerAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isPCVController(pcvControllerAddress)).to.be.equal(false);
  			});
  		});
  		describe('Member Count', function() {
  			it('is one', async function() {
  				expect(await this.core.getRoleMemberCount(this.pcvControllerRole)).to.be.bignumber.equal(new BN(1));
  			});
  			it('updates to two', async function() {
  				await this.core.grantPCVController(userAddress, {from: governorAddress});
  				expect(await this.core.getRoleMemberCount(this.pcvControllerRole)).to.be.bignumber.equal(new BN(2));
  			});
  		});
  		describe('Admin', function() {
  			it('is governor', async function() {
  				expect(await this.core.getRoleAdmin(this.pcvControllerRole)).to.be.equal(this.governorRole);
  			});
  		});
  	});
  	describe('Access', function () {
  		it('onlyMinter reverts', async function() {
  			await expectRevert(this.coreRef.testMinter({from: pcvControllerAddress}), "CoreRef: Caller is not a minter");
  		});

  		it('onlyBurner reverts', async function() {
  			await expectRevert(this.coreRef.testBurner({from: pcvControllerAddress}), "CoreRef: Caller is not a burner");
  		});

  		it('onlyGovernor reverts', async function() {
  			await expectRevert(this.coreRef.testGovernor({from: pcvControllerAddress}), "CoreRef: Caller is not a governor");
  		});

  		it('onlyPCVController succeeds', async function() {
  			await this.coreRef.testPCVController({from: pcvControllerAddress});
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
  		describe('Access renounced', function() {
  			beforeEach(async function() {
  				await this.core.renounceRole(this.governorRole, governorAddress, {from: governorAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isGovernor(governorAddress)).to.be.equal(false);
  			});
  		});
  		describe('Member Count', function() {
  			it('is one', async function() {
  				expect(await this.core.getRoleMemberCount(this.governorRole)).to.be.bignumber.equal(new BN(1));
  			});
  			it('updates to two', async function() {
  				await this.core.grantGovernor(userAddress, {from: governorAddress});
  				expect(await this.core.getRoleMemberCount(this.governorRole)).to.be.bignumber.equal(new BN(2));
  			});
  		});
  		describe('Admin', function() {
  			it('is governor', async function() {
  				expect(await this.core.getRoleAdmin(this.governorRole)).to.be.equal(this.governorRole);
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

  		it('onlyPCVController reverts', async function() {
  			await expectRevert(this.coreRef.testPCVController({from: governorAddress}), "CoreRef: Caller is not a PCV controller");
  		});
  	});

  	describe('Access Control', function () {
  		describe('Minter', function() {
  			it('can grant', async function() {
  				await this.core.grantMinter(userAddress, {from: governorAddress});
  				expect(await this.core.isMinter(userAddress)).to.be.equal(true);
  			});
  			it('can revoke', async function() {
  				await this.core.revokeMinter(minterAddress, {from: governorAddress});
  				expect(await this.core.isMinter(minterAddress)).to.be.equal(false);
  			});
  		});
  		describe('Burner', function() {
  			it('can grant', async function() {
  				await this.core.grantBurner(userAddress, {from: governorAddress});
  				expect(await this.core.isBurner(userAddress)).to.be.equal(true);
  			});
  			it('can revoke', async function() {
  				await this.core.revokeBurner(burnerAddress, {from: governorAddress});
  				expect(await this.core.isBurner(burnerAddress)).to.be.equal(false);
  			});
  		});
  		describe('PCV Controller', function() {
  			it('can grant', async function() {
  				await this.core.grantPCVController(userAddress, {from: governorAddress});
  				expect(await this.core.isPCVController(userAddress)).to.be.equal(true);
  			});
  			it('can revoke', async function() {
  				await this.core.revokePCVController(pcvControllerAddress, {from: governorAddress});
  				expect(await this.core.isPCVController(pcvControllerAddress)).to.be.equal(false);
  			});
  		});
  		describe('Governor', function() {
  			it('can grant', async function() {
  				await this.core.grantGovernor(userAddress, {from: governorAddress});
  				expect(await this.core.isGovernor(userAddress)).to.be.equal(true);
  			});
  			it('can revoke', async function() {
  				await this.core.revokeGovernor(governorAddress, {from: governorAddress});
  				expect(await this.core.isGovernor(governorAddress)).to.be.equal(false);
  			});
  		});
  	});
  });
});