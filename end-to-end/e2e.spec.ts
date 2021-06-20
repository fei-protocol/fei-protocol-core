import { expect, web3 } from 'hardhat'
import { TestEndtoEndCoordinator } from './setup';
import { TestEnvContracts } from './setup/types';
const { Contract } = web3.eth;
const { toBN } = web3.utils;

describe('e2e', function () {
  let contracts: TestEnvContracts;
  let deployAddress: string;

  const tenPow18 = toBN('1000000000000000000');

  before(async function () {
    // Setup test environment and get contracts
    const version = 1
    deployAddress = (await web3.eth.getAccounts())[0];
    
    const config = {
      logging: false,
      deployAddress: deployAddress,
      version: version,
      network: 'local'
    }
    const e2eCoord = new TestEndtoEndCoordinator(config);
    ({ contracts } = await e2eCoord.initialiseLocalEnv())
  })

  this.beforeEach(async function () {
    // Seed bonding curve with eth and update oracle
    const bondingCurve = contracts.bondingCurve
    const ethSeedAmount = tenPow18.mul(toBN(200))
    await bondingCurve.purchase(deployAddress, ethSeedAmount, {value: ethSeedAmount})
    await bondingCurve.updateOracle();
  })

  it('should allow purchase of Fei through bonding curve', async function () {
    const bondingCurve = contracts.bondingCurve;
    const fei = contracts.fei;
    const feiBalanceBefore = await fei.balanceOf(deployAddress);

    const ethAmount = tenPow18; // 1 ETH
    const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
    const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

    // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
    const expected = ethAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);

    await bondingCurve.purchase(deployAddress, ethAmount, {value: ethAmount});
    
    const feiBalanceAfter = await fei.balanceOf(deployAddress);
    const expectedFinalBalance = feiBalanceBefore.add(expected)
    expect(feiBalanceAfter).to.be.bignumber.equal(expectedFinalBalance);
  })

  // WIP
  it.skip('should transfer allocation from bonding curve to the reserve stabiliser', async function () {
    const bondingCurve = contracts.bondingCurve;

    // 1. Make sure there is ETH in bonding curve
    const curveEthBalanceBefore = toBN(await web3.eth.getBalance(bondingCurve.address));
    expect(curveEthBalanceBefore).to.be.bignumber.greaterThan(toBN(0))

    const fei = contracts.fei;
    const callerFeiBalanceBefore = await fei.balanceOf(deployAddress)

    const pcvAllocations = await bondingCurve.getAllocation()
    const pcvDepositAddresses = pcvAllocations[0]

    // 2. Get the Eth balances of the pcvDeposit allocation (class PCVSplitter)
    // Check duration window to see if passed (potentially fast-forward to ensure passed)
    const pcvDepositAddressBalances = await Promise.all(pcvDepositAddresses.map(async address => await web3.eth.getBalance(address)))
    const durationWindow = await bondingCurve.duration()
    // TODO: Get current time, check if duration window passed. If not fast forward

    // 3. trigger allocate
    await bondingCurve.allocate()
  
    // 4. Make sure ETH leaves bonding curve and goes to allocation 
    // When checking balances use the .balance()
    // (possible amount received != sent if allocation includes EthUniswapPCVDeposit)
    
    const allocatedEth = toBN(5) // TODO calculate
    const curveEthBalanceAfter = toBN(await web3.eth.getBalance(bondingCurve.address));
    expect(curveEthBalanceAfter).to.be.bignumber.equal(curveEthBalanceBefore.sub(allocatedEth))

    // 5. Make sure caller receives FEI incentive if duration had passed
    const expectedFeiIncentive = toBN(5) // TODO: calculate
    const callerFeiBalanceAfter = await fei.balanceOf(deployAddress);
    expect(callerFeiBalanceAfter).to.be.bignumber.equal(callerFeiBalanceBefore.add(expectedFeiIncentive))
  })

  // WIP
  it.skip('should be able to redeem Fei from stabiliser', async function () {
    const reserveStabiliser = contracts.ethReserveStabilizer;
    const fei = contracts.fei;

    const userEthBalanceBefore = toBN(await web3.eth.getBalance(deployAddress))
    const userFeiBalanceBefore = toBN(await fei.balanceOf(deployAddress))

    const feiTokensRedeem = toBN(5).mul(tenPow18)
    await reserveStabiliser.exchangeFei(feiTokensRedeem)

    async function calcAmountOut() {
      const usdPerFeiBasisPoints = 9900
      const basisPointsGranularity = 10000
      const adjustedAmountIn = feiTokensRedeem.mul((toBN(usdPerFeiBasisPoints).div(toBN(basisPointsGranularity))))
      const price = toBN((await reserveStabiliser.readOracle())[0])
      const invertedPrice = toBN(1).div(price)
      return invertedPrice.mul(adjustedAmountIn);
    }

    const expectedAmountOut = await calcAmountOut()    
    const userEthBalanceAfter = toBN(await web3.eth.getBalance(deployAddress))
    const userFeiBalanceAfter = toBN(await fei.balanceOf(deployAddress))
    
    expect(userEthBalanceAfter).to.be.bignumber.equal(userEthBalanceBefore.add(expectedAmountOut))
    expect(userFeiBalanceAfter).to.be.bignumber.equal(userFeiBalanceBefore.sub(feiTokensRedeem))
  })

  it('should perform reweight above peg correctly',  async function () {
    // /scripts/validation/upgrade.js
  })

  it('should perform reweight below peg correctly',  async function () {
    // /scripts/validation/upgrade.js
  })

  it('drip controller can withdraw from PCV deposit to stabiliser', async function () {
    // 1. drain stabilizer
    // 2. Trigger drip
    // 3. check PCV deposit loses dripAmount ETH and stabilizer gets dripAmount ETH
    // 4. check caller receives FEI mint
  })

  it('assert all access control', async function () {
    // make sure all roles that have access do
    // make sure no extra roles have access (perhaps just check cardinality of each role  `core.getRoleMemberCount(role bytes)`)
    // core.BURNER_ROLE() - returns bytes32 role id
  })
});
