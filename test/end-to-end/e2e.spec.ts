import { expect, web3 } from 'hardhat'
import { EndtoEndCoordinator } from './setup';
const { Contract } = web3.eth;

describe('e2e', function () {
  let contracts: typeof Contract[];
  let addresses: string[]

  before(async function () {
    // Setup test environment and get contracts
    const version = 1
    const e2eCoord = new EndtoEndCoordinator('mainnet', version);
    ({contracts, addresses } = await e2eCoord.initialiseMainnetEnv())
  })

  it.only('should allow purchase of Fei through bonding curve', async function () {
    console.log('hello world')
    expect(true).to.equal(true)
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
