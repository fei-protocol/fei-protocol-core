const {
  BN,
  expectRevert,
  getAddresses,
  getCore,
  expect,
} = require('../../helpers');
  
const OptimisticTimelock = artifacts.require('OptimisticTimelock');
  
describe('TimelockedDelegator', function () {
  let userAddress;
  let governorAddress;
  
  beforeEach(async function () {
    ({
      userAddress,
      governorAddress,
    } = await getAddresses());
    this.core = await getCore();

    this.delay = new BN(1000);
    this.timelock = await OptimisticTimelock.new(this.core.address, this.delay, [], []);
  });

  describe('Become Admin', function () {
    it('user reverts', async function() {
      await expectRevert(this.timelock.becomeAdmin({from: userAddress}), 'CoreRef: Caller is not a guardian or governor');
    });

    it('governor succeeds', async function() {
      const adminRole = await this.timelock.TIMELOCK_ADMIN_ROLE();
      await this.timelock.becomeAdmin({from: governorAddress});
      expect(await this.timelock.hasRole(adminRole, governorAddress)).to.be.true;
    });
  });
});
