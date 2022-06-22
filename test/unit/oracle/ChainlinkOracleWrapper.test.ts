import { expect } from 'chai';
import { Signer } from 'ethers';
import hre, { artifacts, ethers } from 'hardhat';
import { getAddresses, getCore } from '../../helpers';

const ChainlinkOracleWrapper = artifacts.readArtifactSync('ChainlinkOracleWrapper');
const MockChainlinkOracle = artifacts.readArtifactSync('MockChainlinkOracle');

const e8 = '00000000';
const e18 = '000000000000000000';

describe('ChainlinkOracleWrapper', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.pcvControllerAddress,
      addresses.minterAddress,
      addresses.burnerAddress,
      addresses.beneficiaryAddress1,
      addresses.beneficiaryAddress2
    ];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    this.core = await getCore();

    const mockChainlinkOracleFactory = await ethers.getContractFactory(
      MockChainlinkOracle.abi,
      MockChainlinkOracle.bytecode
    );
    const chainlinkOracleWrapperFactory = await ethers.getContractFactory(
      ChainlinkOracleWrapper.abi,
      ChainlinkOracleWrapper.bytecode
    );

    this.mockChainlinkOracle = await mockChainlinkOracleFactory.deploy(`500${e8}`, 8); // 8 decimals, val = 500
    this.mockChainlinkOracle2 = await mockChainlinkOracleFactory.deploy(`600${e18}`, 18); // 18 decimals, val = 600
    this.mockChainlinkOracle3 = await mockChainlinkOracleFactory.deploy('700', 0); // 0 decimals, val = 700
    this.oracle = await chainlinkOracleWrapperFactory.deploy(this.core.address, this.mockChainlinkOracle.address);
    this.oracle2 = await chainlinkOracleWrapperFactory.deploy(this.core.address, this.mockChainlinkOracle2.address);
    this.oracle3 = await chainlinkOracleWrapperFactory.deploy(this.core.address, this.mockChainlinkOracle3.address);
  });

  it('paused() is false on deploy', async function () {
    expect(await this.oracle.paused()).to.be.equal(false);
  });

  it('isOutdated() true', async function () {
    await this.mockChainlinkOracle.set('42', '500', '12345', '1245', '41');
    expect(await this.oracle.isOutdated()).to.be.equal(true);
  });

  it('isOutdated() false', async function () {
    expect(await this.oracle.isOutdated()).to.be.equal(false);
  });

  it('update() does nothing, returns false', async function () {
    expect(await this.oracle.isOutdated()).to.be.equal(false);
    await this.oracle.update();
    expect(await this.oracle.isOutdated()).to.be.equal(false);
  });

  it('read() is valid', async function () {
    const read = await this.oracle.read();
    expect(read[1]).to.be.equal(true); // valid
  });

  it('read() is always a Decimal (with 18 decimals)', async function () {
    expect((await this.oracle.read())[0] / 1e18).to.be.equal(500);
    expect((await this.oracle2.read())[0] / 1e18).to.be.equal(600);
    expect((await this.oracle3.read())[0] / 1e18).to.be.equal(700);
  });

  it('read() is invalid if data is from a previous round', async function () {
    await this.mockChainlinkOracle.set('42', '500', '12345', '1245', '41');
    const read = await this.oracle.read();
    expect(read[0] / 1e10).to.be.equal(500);
    expect(read[1]).to.be.equal(false); // invalid
  });
});
