import { expect, web3 } from 'hardhat'
import { TestEndtoEndCoordinator } from './setup';
import { TestEnvContracts } from './setup/types';
const { Contract } = web3.eth;
const { toBN } = web3.utils;

describe('e2e', function () {
  let contracts: TestEnvContracts;
  let deployAddress: string;

  before(async function () {
    // Setup test environment and get contracts
    const version = 1
    deployAddress = (await web3.eth.getAccounts())[0];
    
    const logging = false;
    const e2eCoord = new TestEndtoEndCoordinator('local', deployAddress, logging, version);
    ({contracts } = await e2eCoord.initialiseLocalEnv())
  })

  it.only('should allow purchase of Fei through bonding curve', async function () {
    const bondingCurve = contracts.bondingCurve;

    await bondingCurve.updateOracle();

    const fei = contracts.fei;
    const feiBalanceBefore = await fei.balanceOf(deployAddress);

    const tenPow18 = toBN('1000000000000000000');
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

  it('should transfer allocation from bonding curve to the reserve stabiliser', async function () {
    // 1. Make sure there is ETH in bonding curve
    // 2. Get the Eth balances of the pcvDeposit allocation (class PCVSplitter)
    // Check duration window to see if passed (potentially fast-forward to ensure passed)
    // 3. trigger allocate
    // 4. Make sure ETH leaves bonding curve and goes to allocation 
    // When checking balances use the .balance()
    // (possible amount received != sent if allocation includes EthUniswapPCVDeposit)
    // 5. Make sure caller receives FEI incentive if duration had passed
  })

  it('should be able to redeem Fei from stabiliser', async function () {
    //         uint256 adjustedAmountIn = amountFeiIn * usdPerFeiBasisPoints / BASIS_POINTS_GRANULARITY;
    //        return invert(readOracle()).mul(adjustedAmountIn).asUint256();
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
