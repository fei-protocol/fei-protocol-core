const {
  BN,
  expect,
  Roots
} = require('../helpers');

describe('Roots', function () {
  beforeEach(async function() {
    this.roots = await Roots.new();
  });
  describe('Cube Root', async function() {
    describe('Below 8', function () {
      it('0', async function () {
        expect(await this.roots.cubeRoot(0)).to.be.bignumber.equal(new BN(0));
      });
  
      it('1', async function () {
        expect(await this.roots.cubeRoot(1)).to.be.bignumber.equal(new BN(1));
      });
  
      it('7', async function () {
        expect(await this.roots.cubeRoot(1)).to.be.bignumber.equal(new BN(1));
      });
    });
  
    describe('Above 8', function() {
      it('8', async function () {
        expect(await this.roots.cubeRoot(8)).to.be.bignumber.equal(new BN(2));
      });
  
      it('26', async function () {
        expect(await this.roots.cubeRoot(26)).to.be.bignumber.equal(new BN(2));
      });
      
      it('27', async function () {
        expect(await this.roots.cubeRoot(27)).to.be.bignumber.equal(new BN(3));
      });
  
      it('511', async function () {
        expect(await this.roots.cubeRoot(511)).to.be.bignumber.equal(new BN(7));
      });
  
      it('512', async function () {
        expect(await this.roots.cubeRoot(512)).to.be.bignumber.equal(new BN(8));
      });
  
      it('10000', async function () {
        expect(await this.roots.cubeRoot(10000)).to.be.bignumber.equal(new BN(21));
      });
  
      it('999999999', async function () {
        expect(await this.roots.cubeRoot(999999999)).to.be.bignumber.equal(new BN(999));
      });
  
      it('1000000000', async function () {
        expect(await this.roots.cubeRoot(1000000000)).to.be.bignumber.equal(new BN(1000));
      });
  
      it('100000000000000000000', async function () {
        expect(await this.roots.cubeRoot("100000000000000000000")).to.be.bignumber.equal(new BN(4641588));
      });
    });
  });
});