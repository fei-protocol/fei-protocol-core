const {
  BN,
  expectEvent,
  expectRevert,
  expect,
  getCore,
  getAddresses,
} = require('../helpers');

const MockSushiMigrator = artifacts.require("MockSushiMigrator");
const Tribe = artifacts.require('MockTribe');
const MockCoreRef = artifacts.require('MockCoreRef');
const MasterChief = artifacts.require('MasterChief');
const MockERC20 = artifacts.require('MockERC20');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ONE_ADDRESS = '0x0000000000000000000000000000000000000001';

describe('MasterChief', function () {
  let pid;
  let minterAddress;
  let governorAddress;
  let userAddress;

  const allocationPoints = 100;
  const totalStaked = '100000000000000000000';
  const mintAmount = new BN('1000000000000000000000000000000000000000000000');

  beforeEach(async function () {
    ({
      userAddress,
      governorAddress,
    } = await getAddresses());

    this.core = await getCore(false);

    this.tribe = await Tribe.new();
    this.migrator = await MockSushiMigrator.new();
    this.coreRef = await MockCoreRef.new(this.core.address);

    this.masterChief = await MasterChief.new(this.core.address, this.tribe.address);

    // create and mint LP tokens
    this.LPToken = await MockERC20.new();
    await this.LPToken.mint(this.masterChief.address, totalStaked);

    // create new reward stream
    const tx = await this.masterChief.add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, { from: governorAddress });
    // grab PID from the logs
    pid = Number(tx.logs[0].args.pid);
  });

  describe('Test Migration', function() {

    it('governor should be able to setMigrator', async function() {
        expect(await this.masterChief.migrator()).to.be.equal(ZERO_ADDRESS);
        await this.masterChief.setMigrator(this.migrator.address, { from: governorAddress });
        expect(await this.masterChief.migrator()).to.be.equal(this.migrator.address);
    });

    it('should be able to migrate LP token balance to the migrator contract', async function() {
        await this.masterChief.setMigrator(this.migrator.address, { from: governorAddress });
        expect(await this.masterChief.migrator()).to.be.equal(this.migrator.address);

        expect(await this.LPToken.balanceOf(this.masterChief.address)).to.be.bignumber.equal(new BN(totalStaked));
        expect(await this.LPToken.balanceOf(this.migrator.address)).to.be.bignumber.equal(new BN('0'));
        await this.masterChief.migrate(pid);
        expect(await this.LPToken.balanceOf(this.migrator.address)).to.be.bignumber.equal(new BN(totalStaked));
        expect(await this.LPToken.balanceOf(this.masterChief.address)).to.be.bignumber.equal(new BN('0'));
    });
  });
});

