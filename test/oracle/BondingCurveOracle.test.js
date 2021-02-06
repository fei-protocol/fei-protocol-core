const {
  userAddress,
  governorAddress,
  genesisGroup,
  BN,
  expectEvent,
  expectRevert,
  time,
  expect,
  BondingCurveOracle,
  MockBondingCurve,
  MockOracle,
  getCore
} = require('../helpers');

describe('BondingCurveOracle', function () {

  beforeEach(async function () {
    this.core = await getCore(true);
    this.core.setGenesisGroup(genesisGroup, {from: governorAddress});
    this.mockOracle = await MockOracle.new(500);
    this.bondingCurve = await MockBondingCurve.new(false, 80000);
    
    let duration = 4 * 7 * 24 * 60 * 60;
    this.oracle = await BondingCurveOracle.new(this.core.address, this.mockOracle.address, this.bondingCurve.address, duration);
  });

  describe('Update', function() {
    it('updates uniswap oracle', async function() {
      expect(await this.mockOracle.updated()).to.be.equal(false);
      await this.oracle.update();
      expect(await this.mockOracle.updated()).to.be.equal(true);
    });
  });

  describe('isOutdated', function() {
    it('reads uniswapOracle', async function() {
      expect(await this.oracle.isOutdated()).to.be.equal(false);
      await this.mockOracle.setOutdated(true);
      expect(await this.oracle.isOutdated()).to.be.equal(true);
    });
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
        await this.oracle.init(['500000000000000000'], {from: genesisGroup});
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