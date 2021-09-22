const { expect, getCore } = require('../../helpers');

const ChainlinkOracleWrapper = artifacts.readArtifactSync('ChainlinkOracleWrapper');
const MockChainlinkOracle = artifacts.readArtifactSync('MockChainlinkOracle');

const e8 = '00000000';
const e18 = '000000000000000000';

describe('ChainlinkOracleWrapper', function () {
  beforeEach(async function () {
    this.core = await getCore(true);
    this.mockChainlinkOracle = await MockChainlinkOracle.new(`500${e8}`, 8); // 8 decimals, val = 500
    this.mockChainlinkOracle2 = await MockChainlinkOracle.new(`600${e18}`, 18); // 18 decimals, val = 600
    this.mockChainlinkOracle3 = await MockChainlinkOracle.new('700', 0); // 0 decimals, val = 700
    this.oracle = await ChainlinkOracleWrapper.new(this.core.address, this.mockChainlinkOracle.address);
    this.oracle2 = await ChainlinkOracleWrapper.new(this.core.address, this.mockChainlinkOracle2.address);
    this.oracle3 = await ChainlinkOracleWrapper.new(this.core.address, this.mockChainlinkOracle3.address);
  });

  it('paused() is false on deploy', async function() {
    expect(await this.oracle.paused()).to.be.equal(false);
  });
  it('isOutdated() true', async function() {
    await this.mockChainlinkOracle.set('42', '500', '12345', '1245', '41');
    expect(await this.oracle.isOutdated()).to.be.equal(true);
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
  it('read() is always a Decimal (with 18 decimals)', async function() {
    expect((await this.oracle.read())[0] / 1e18).to.be.equal(500);
    expect((await this.oracle2.read())[0] / 1e18).to.be.equal(600);
    expect((await this.oracle3.read())[0] / 1e18).to.be.equal(700);
  });
  it('read() is invalid if data is from a previous round', async function() {
    await this.mockChainlinkOracle.set('42', '500', '12345', '1245', '41');
    const read = await this.oracle.read();
    expect(read[0] / 1e10).to.be.equal(500);
    expect(read[1]).to.be.equal(false); // invalid
  });
});
