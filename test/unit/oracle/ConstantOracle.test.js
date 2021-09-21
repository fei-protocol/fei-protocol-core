const { expect, getCore, getAddresses } = require('../../helpers');

const ConstantOracle = artifacts.require('ConstantOracle');

describe('ConstantOracle', function () {
  let governorAddress;

  beforeEach(async function () {
    ({ governorAddress } = await getAddresses());  
    this.core = await getCore(true);
    this.oracle = await ConstantOracle.new(this.core.address, '200100');
  });

  it('isOutdated() false', async function() {
    expect(await this.oracle.isOutdated()).to.be.equal(false);
  });

  it('update() does nothing, returns false', async function() {
    expect(await this.oracle.isOutdated()).to.be.equal(false);
    await this.oracle.update();
    expect(await this.oracle.isOutdated()).to.be.equal(false);
  });
  it('read() is valid', async function() {
    const read = await this.oracle.read();
    expect(read[1]).to.be.equal(true); // valid
  });
  it('read() is invalid if paused', async function() {
    await this.oracle.pause({from: governorAddress});
    const read = await this.oracle.read();
    expect(read[1]).to.be.equal(false); // invalid
  });
  it('read() is always a Decimal (with 18 decimals)', async function() {
    expect((await this.oracle.read())[0] / 1e18).to.be.equal(20.01);
  });
});
