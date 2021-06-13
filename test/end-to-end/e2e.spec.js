const { FORK_MAINNET } = process.env;
const { TestEnvCoordinator } = require('./setup');

describe('e2e', function () {
  before(async function () {
    // Setup test environment and get contracts
    const testEnvCoordinator = new TestEnvCoordinator()
    ({ contracts, accounts} = testEnvCoordinator.get;
  })

  it('should allow purchase of Fei through bonding curve', async function () {
    

  })

  it('should transfer allocation from bonding curve to the reserve stabiliser', async function () {
    
  })

  it('should be able to redeem Fei from stabiliser', async function () {

  })

  it('should perform reweight above peg correctly',  async function () {

  })

  it('should perform reweight below peg correctly',  async function () {
    
  })

  it('drip controller can withdraw from PCV deposit to stabiliser', async function () {
  })
});
