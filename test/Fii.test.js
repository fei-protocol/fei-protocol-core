const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Fii = contract.fromArtifact('Fii');
const MockCore = contract.fromArtifact('MockSettableCore');

describe('Fii', function () {
  const [ minterAddress, burnerAddress, userAddress ] = accounts;

  beforeEach(async function () {
    this.core = await MockCore.new({gas: 8000000});
    this.fii = await Fii.at(await this.core.fii());
    await this.core.grantMinter(minterAddress);
    await this.core.grantBurner(burnerAddress);
  });

  describe('mint', function () {
    describe('not from minter', function () {
      it('reverts', async function () {
        await expectRevert(this.fii.mint(userAddress, 100), "CoreRef: Caller is not a minter");
      });
    });

    describe('from minter', function () {
   	  beforeEach(async function () {
        await this.fii.mint(userAddress, 100, {from: minterAddress});
      });

      it('mints new Fii tokens', async function () {
        expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
      });
    });
  });

  describe('burn', function () {
    describe('not from burner', function () {
      it('reverts', async function () {
        await expectRevert(this.fii.burnFrom(userAddress, 100), "CoreRef: Caller is not a burner");
      });
    });

    describe('from burner to user with sufficient balance', function () {
      beforeEach(async function () {
      	await this.fii.mint(userAddress, 200, {from: minterAddress});
        await this.fii.burnFrom(userAddress, 100, {from: burnerAddress});
      });
      it('burn Fii tokens', async function () {
        expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
      });
    });
    describe('from burner to user without sufficient balance', function () {
      it('burn Fii tokens', async function () {
        await expectRevert(this.fii.burnFrom(userAddress, 100, {from: burnerAddress}), "ERC20: burn amount exceeds balance");
      });
    });
  });

  // describe('incentives', function() {
  // 	describe('via transferFrom', function() {
  // 		describe('on sender', function() {

  // 		});
  // 		describe('on spender', function() {

  // 		});
  // 		describe('on receiver', function() {

  // 		});
  // 		describe('on all', function() {

  // 		});
  // 		describe('on sender and spender', function() {

  // 		});
  // 		describe('on sender and receiver', function() {

  // 		});
  // 		describe('on receiver and all', function() {

  // 		});
  // 	});
  // 	describe('via transfer', function() {
  // 		describe('on sender', function() {

  // 		});
  // 		describe('on spender', function() {

  // 		});
  // 		describe('on receiver', function() {

  // 		});
  // 		describe('on all', function() {

  // 		});
  // 		describe('on sender and spender', function() {

  // 		});
  // 		describe('on sender and receiver', function() {

  // 		});
  // 		describe('on receiver and all', function() {

  // 		});
  // 	});
  // });

});