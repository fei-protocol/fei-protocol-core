const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const BondingCurveOracle = contract.fromArtifact('BondingCurveOracle');
const Core = contract.fromArtifact('Core');
const MockOracle = contract.fromArtifact('MockOracle');
const MockBondingCurve = contract.fromArtifact('MockBondingCurve')

describe('BondingCurveOracle', function () {
  const [ userAddress, governorAddress, genesisGroup ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({from: governorAddress});
    this.core.setGenesisGroup(genesisGroup, {from: governorAddress});
    this.mockOracle = await MockOracle.new(500);
    this.bondingCurve = await MockBondingCurve.new(false, 80000);

    this.oracle = await BondingCurveOracle.new(this.core.address, this.mockOracle.address, this.bondingCurve.address);
  });

  describe('Read', function() {
    describe('Uninitialized', function() {
      it('returns invalid', async function() {
        let result = await this.oracle.read();
        expect(result[0].value).to.be.equal('0');
        expect(result[1]).to.be.equal(false);
      });
    });

    describe('Initialized', function() {
      beforeEach(async function() {
        await this.oracle.init(['1000000000000000000000'], {from: genesisGroup});
      });

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

      describe('Beginning of Thawing Period', function() {
        describe('Pre Scale', function() {
          it('returns bonding curve oracle info', async function() {
            let result = await this.oracle.read();
            expect(result[0].value).to.be.equal('1000000000000000000000');
            expect(result[1]).to.be.equal(true);
          });
        });

        describe('At Scale', function() {
          beforeEach(async function() {
            await this.bondingCurve.setScale(true);
          });
          it('returns uniswap oracle info', async function() {
            let result = await this.oracle.read();
            expect(result[0].value).to.be.equal('1000000000000000000000');
            expect(result[1]).to.be.equal(true);
          });
        });
      });

      describe('Halfway through Thawing Period', function() {
        beforeEach(async function() {
          let d = await this.oracle.duration();
          await time.increase(d.div(new BN(2)));
        });

        describe('Pre Scale', function() {
          it('returns bonding curve oracle info', async function() {
            let result = await this.oracle.read();
            expect(result[0].value).to.be.equal('888888888888888888888');
            expect(result[1]).to.be.equal(true);
          });
        });

        describe('At Scale', function() {
          beforeEach(async function() {
            await this.bondingCurve.setScale(true);
          });
          it('returns uniswap oracle info', async function() {
            let result = await this.oracle.read();
            expect(result[0].value).to.be.equal('666666666666666666666');
            expect(result[1]).to.be.equal(true);
          });
        });
      });

      describe('End of Thawing Period', function() {
        beforeEach(async function() {
          await time.increase(await this.oracle.duration());
        });

        describe('Pre Scale', function() {
          it('returns bonding curve oracle info', async function() {
            let result = await this.oracle.read();
            expect(result[0].value).to.be.equal('800000000000000000000');
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