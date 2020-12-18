const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const BondingCurveOracle = contract.fromArtifact('BondingCurveOracle');
const Core = contract.fromArtifact('Core');
const MockOracle = contract.fromArtifact('MockOracle');
const MockBondingCurve = contract.fromArtifact('MockBondingCurve')

describe('BondingCurveOracle', function () {
  const [ userAddress, governorAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({from: governorAddress});
    this.mockOracle = await MockOracle.new(500);
    this.bondingCurve = await MockBondingCurve.new(false, 70000);

    this.oracle = await BondingCurveOracle.new(this.core.address, this.mockOracle.address, this.bondingCurve.address);
  });

  describe('Read', function() {
    describe('Kill switch', function() {
      beforeEach(async function() {
        await this.oracle.setKillSwitch(true, {from: governorAddress});
      });
      it('returns invalid', async function() {
        let result = await this.oracle.read();
        expect(result[0].value).to.be.equal('0');
        expect(result[1]).to.be.equal(false);
      });
    });

    describe('Pre Scale', function() {
      it('returns bonding curve oracle info', async function() {
        let result = await this.oracle.read();
        expect(result[0].value).to.be.equal('700000000000000000000');
        expect(result[1]).to.be.equal(true);
      });
    });

    describe('At Scale', function() {
      beforeEach(async function() {
        await this.bondingCurve.setScale(true);
      });
      it('returns uniswap oracle info', async function() {
        let result = await this.oracle.read();
        expect(result[0].value).to.be.equal('500000000000000000000');
        expect(result[1]).to.be.equal(true);
      });
    });
  });

  describe('Access', function() {
    describe('Kill Switch', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
            await this.oracle.setKillSwitch(true, {from: governorAddress}),
            'KillSwitchUpdate',
            { _killSwitch: true }
          );
        expect(await this.oracle.killSwitch()).to.be.equal(true);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.oracle.setKillSwitch(false, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});