const {
  expectRevert,
  expect,
  getAddresses,
  getCore
} = require('../helpers');
  
const CompositeOracle = artifacts.require('CompositeOracle');
const MockOracle = artifacts.require('MockOracle');
  
describe('CompositeOracle', function () {
  let governorAddress;

  beforeEach(async function () {
    ({ governorAddress } = await getAddresses());
    this.core = await getCore(true);
      
    this.oracleA = await MockOracle.new(400);
    this.oracleB = await MockOracle.new(2);

    this.oracle = await CompositeOracle.new(this.core.address, this.oracleA.address, this.oracleB.address);
  });
  
  describe('Init', function() {
    it('oracleA', async function() {
      expect(await this.oracle.oracleA()).to.be.equal(this.oracleA.address);
    });
  
    it('oracleB', async function() {
      expect(await this.oracle.oracleB()).to.be.equal(this.oracleB.address);
    });
  
    it('paused', async function() {
      expect(await this.oracle.paused()).to.be.equal(false);
    });
  });
  
  describe('Is Outdated', function() {
    describe('Both up to date', function() {
      it('returns false', async function() {
        const result = await this.oracle.isOutdated();
        expect(result).to.be.equal(false);
      });
    });
  
    describe('One outdated', function() {
      describe('Oracle A', function() {
        beforeEach(async function() {
          await this.oracleA.setOutdated(true);
        });
    
        it('returns true', async function() {
          const result = await this.oracle.isOutdated();
          expect(result).to.be.equal(true);
        });
      });
    
      describe('Oracle B', function() {
        beforeEach(async function() {
          await this.oracleB.setOutdated(true);
        });
    
        it('returns true', async function() {
          const result = await this.oracle.isOutdated();
          expect(result).to.be.equal(true);
        });
      });
    });
  }); 
  describe('Read', function() {
    describe('Both Valid', function() {
      describe('Paused', function() {
        beforeEach(async function() {
          await this.oracle.pause({from: governorAddress});
        });
  
        it('returns invalid', async function() {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('800000000000000000000');
          expect(result[1]).to.be.equal(false);
        });
      });
  
      describe('Unpaused', function() {
        it('returns valid', async function() {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('800000000000000000000');
          expect(result[1]).to.be.equal(true);
        });
      });
    });

    describe('One Invalid', function() {
      describe('Oracle A', function() {
        beforeEach(async function() {
          await this.oracleA.setValid(false);
        });
  
        it('returns invalid', async function() {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('800000000000000000000');
          expect(result[1]).to.be.equal(false);
        });
      });
  
      describe('Oracle B', function() {
        beforeEach(async function() {
          await this.oracleB.setValid(false);
        });
    
        it('returns invalid', async function() {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('800000000000000000000');
          expect(result[1]).to.be.equal(false);
        });
      });
    });
  });
  describe('Update', function() {
    describe('Paused', function() {
      it('reverts', async function() {
        await this.oracle.pause({from: governorAddress});
        await expectRevert(this.oracle.update(), 'Pausable: paused');
      });
    });
      
    describe('Unpaused', function() {
      beforeEach(async function() {
        await this.oracle.update();
      });
  
      it('updates both', async function() {
        expect(await this.oracleA.updated()).to.be.equal(true);
        expect(await this.oracleB.updated()).to.be.equal(true);
      });
    });
  });
});
