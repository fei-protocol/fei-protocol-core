const {
  expect,
  contract,
  getCore
} = require('../helpers');

const ChainlinkOracleWrapper = contract.fromArtifact('ChainlinkOracleWrapper');
const MockChainlinkOracle = contract.fromArtifact('MockChainlinkOracle');

const e8 = '00000000';
const e18 = '000000000000000000';

describe('ChainlinkOracleWrapper', function () {
  beforeEach(async function () {
    this.core = await getCore(true);
    this.mockChainlinkOracle = await MockChainlinkOracle.new('500'+e8, 8); // 8 decimals, val = 500
    this.mockChainlinkOracle2 = await MockChainlinkOracle.new('600'+e18, 18); // 18 decimals, val = 600
    this.mockChainlinkOracle3 = await MockChainlinkOracle.new('700', 0); // 0 decimals, val = 700
    this.oracle = await ChainlinkOracleWrapper.new(this.core.address, this.mockChainlinkOracle.address);
    this.oracle2 = await ChainlinkOracleWrapper.new(this.core.address, this.mockChainlinkOracle2.address);
    this.oracle3 = await ChainlinkOracleWrapper.new(this.core.address, this.mockChainlinkOracle3.address);
  });

  it('paused() is false on deploy', async function() {
    expect(await this.oracle.paused()).to.be.equal(false);
  });
  it('isOutdated() never false', async function() {
    expect(await this.oracle.isOutdated()).to.be.equal(false);
  });
  it('update() does nothing', async function() {
    expect(await this.oracle.isOutdated()).to.be.equal(false);
    await this.oracle.update();
    expect(await this.oracle.isOutdated()).to.be.equal(false);
  });
  it('read() is always valid', async function() {
    const read = await this.oracle.read();
    expect(read[1]).to.be.equal(true); // always valid
  });
  it('read() is always a Decimal (with 18 decimals)', async function() {
    expect((await this.oracle.read())[0] / 1e18).to.be.equal(500);
    expect((await this.oracle2.read())[0] / 1e18).to.be.equal(600);
    expect((await this.oracle3.read())[0] / 1e18).to.be.equal(700);
  });
});