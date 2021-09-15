import hre, { artifacts, expect, web3 } from 'hardhat'
import { time } from '@openzeppelin/test-helpers';
import { TestEndtoEndCoordinator } from './setup';
import { MainnetContractAddresses, MainnetContracts } from './setup/types';
import { forceEth } from './setup/utils'
import { BN, expectApprox, expectEvent } from '../test/helpers'
import proposals from './proposals_config.json'

const uintMax = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

const { toBN } = web3.utils;

// We will drip 4 million tribe per week
const dripAmount = new BN(4000000).mul(new BN(10).pow(new BN(18)));
// number of seconds between allowed drips
// this is 1 week in seconds
const dripFrequency = 604800;

describe('e2e', function () {
  let contracts: MainnetContracts;
  let contractAddresses: MainnetContractAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;

  const tenPow18 = toBN('1000000000000000000');

  before(async function () {
    // Setup test environment and get contracts
    const version = 1
    deployAddress = (await web3.eth.getAccounts())[0];

    const config = {
      logging: Boolean(process.env.LOGGING),
      deployAddress: deployAddress,
      version: version,
    }
    e2eCoord = new TestEndtoEndCoordinator(config, proposals);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment())

    await contracts.uniswapPCVDeposit.deposit()
  })

  describe('PCV Equity Minter + LBP', async function() {
    it('mints appropriate amount and swaps', async function() {
      const { pcvEquityMinter, collateralizationOracleWrapper, staticPcvDepositWrapper, feiTribeLBPSwapper, tribe, tribeSplitter } = contracts;

      await time.increase(await pcvEquityMinter.remainingTime());

      const pcvStats = await collateralizationOracleWrapper.pcvStats();
      if (pcvStats[2] < 0) {
        await staticPcvDepositWrapper.setBalance(pcvStats[0]);
      }
      await collateralizationOracleWrapper.update();

      const mintAmount = await pcvEquityMinter.mintAmount();
      console.log(mintAmount.toString());
      const balancesBefore = await feiTribeLBPSwapper.getReserves();

      const splitterBalanceBefore = await tribe.balanceOf(tribeSplitter.address);

      await pcvEquityMinter.mint();

      const balancesAfter = await feiTribeLBPSwapper.getReserves();
    
      expectApprox(balancesBefore[0].add(mintAmount), balancesAfter[0]);
      expect(await feiTribeLBPSwapper.swapEndTime()).to.be.bignumber.greaterThan(toBN(await time.latest()));
      
      await time.increase(await pcvEquityMinter.duration());
      await pcvEquityMinter.mint();

      expect(await tribe.balanceOf(tribeSplitter.address)).to.be.bignumber.greaterThan(splitterBalanceBefore);
    });
  });

  describe('Collateralization Oracle', async function () {
    it('exempting an address removes from PCV stats', async function () {
      const {collateralizationOracle, compoundEthPCVDeposit } = contracts;

      const beforeBalance = await compoundEthPCVDeposit.balance();

      const beforeStats = await collateralizationOracle.pcvStats();
      await collateralizationOracle.setDepositExclusion(compoundEthPCVDeposit.address, true);
      const afterStats = await collateralizationOracle.pcvStats();

      expectApprox(afterStats[0], beforeStats[0].sub(beforeBalance));
      expectApprox(afterStats[1], afterStats[1]);
      expectApprox(afterStats[2], beforeStats[2].sub(beforeBalance));
    });
  });

  describe('Collateralization Oracle Keeper', async function () {
    it('can only call when deviation or time met', async function () {     
      const { staticPcvDepositWrapper, collateralizationOracleWrapper, collateralizationOracleKeeper, fei } = contracts;

      const beforeBalance = await fei.balanceOf(deployAddress);

      await collateralizationOracleWrapper.update();

      // After updating everything should be up to date
      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.false;

      // After time increase, should be outdated
      await time.increase(await collateralizationOracleWrapper.remainingTime());

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.true;
      expect(await collateralizationOracleWrapper.isOutdated()).to.be.true;
      expect(await collateralizationOracleWrapper.isExceededDeviationThreshold()).to.be.false;

      // UpdateIfOutdated succeeds
      await collateralizationOracleWrapper.updateIfOutdated({from: deployAddress});

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.false;
      
      // Increase PCV balance to exceed deviation threshold
      const pcvStats = await collateralizationOracleWrapper.pcvStats();
      await staticPcvDepositWrapper.setBalance(pcvStats[0]);

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.true;
      expect(await collateralizationOracleWrapper.isOutdated()).to.be.false;
      expect(await collateralizationOracleWrapper.isExceededDeviationThreshold()).to.be.true;

      // Keeper is incentivized to update oracle
      await time.increase(await collateralizationOracleKeeper.MIN_MINT_FREQUENCY());
      await collateralizationOracleKeeper.mint({from: deployAddress});

      const incentive = await collateralizationOracleKeeper.incentiveAmount();
      expect(beforeBalance.add(incentive)).to.be.bignumber.equal(await fei.balanceOf(deployAddress));
      
      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.false;
    });
  });

  describe('TribeReserveStabilizer', async function() {
    it('mint TRIBE', async function () {
      const { tribeReserveStabilizer, tribe } = contracts;
      const tribeSupply = await tribe.totalSupply();
      const balanceBefore = await tribe.balanceOf(deployAddress);

      await tribeReserveStabilizer.mint(deployAddress, '100000');

      // Minting increases total supply and target balance
      expect(balanceBefore.add(new BN('100000'))).to.be.bignumber.equal(await tribe.balanceOf(deployAddress));
      expect(tribeSupply.add(new BN('100000'))).to.be.bignumber.equal(await tribe.totalSupply());
    });

    it('exchangeFei', async function () {
      const { fei, staticPcvDepositWrapper, tribe, tribeReserveStabilizer, collateralizationOracleWrapper } = contracts;

      await fei.mint(deployAddress, tenPow18.mul(tenPow18).mul(toBN(4)));
      await collateralizationOracleWrapper.update();
      
      const userFeiBalanceBefore = toBN(await fei.balanceOf(deployAddress));
      const userTribeBalanceBefore = await tribe.balanceOf(deployAddress);

      const feiTokensExchange = toBN(40000000000000)
      await tribeReserveStabilizer.updateOracle();
      const expectedAmountOut = await tribeReserveStabilizer.getAmountOut(feiTokensExchange);
      await tribeReserveStabilizer.exchangeFei(feiTokensExchange);
  
      const userFeiBalanceAfter = toBN(await fei.balanceOf(deployAddress))
      const userTribeBalanceAfter = await tribe.balanceOf(deployAddress);

      expect(userTribeBalanceAfter.sub(toBN(expectedAmountOut))).to.be.bignumber.equal(userTribeBalanceBefore);
      expect(userFeiBalanceAfter).to.be.bignumber.equal(userFeiBalanceBefore.sub(feiTokensExchange));

      await staticPcvDepositWrapper.setBalance(tenPow18.mul(tenPow18).mul(toBN(10)));
      await collateralizationOracleWrapper.update();
      expect(await tribeReserveStabilizer.isCollateralizationBelowThreshold()).to.be.false;
    });
  });

  describe('TRIBE Splitter', async function () {
    it('splits TRIBE 3 ways', async function () {
      const { tribeSplitter, tribeReserveStabilizer, tribe, erc20Dripper, core } = contracts;

      await core.allocateTribe(tribeSplitter.address, '1000000');

      const beforeBalanceStabilizer = await tribe.balanceOf(tribeReserveStabilizer.address);
      const beforeBalanceDripper = await tribe.balanceOf(erc20Dripper.address);
      const beforeBalanceCore = await tribe.balanceOf(core.address);

      await tribeSplitter.allocate();

      const afterBalanceStabilizer = await tribe.balanceOf(tribeReserveStabilizer.address);
      const afterBalanceDripper = await tribe.balanceOf(erc20Dripper.address);
      const afterBalanceCore = await tribe.balanceOf(core.address);

      expectApprox(beforeBalanceStabilizer, afterBalanceStabilizer.sub(new BN('600000')));
      expectApprox(beforeBalanceDripper, afterBalanceDripper.sub(new BN('200000')));
      expectApprox(beforeBalanceCore, afterBalanceCore.sub(new BN('200000')));
    });
  });

  describe('BondingCurve', async () => {
    describe('ETH', async function () {
      beforeEach(async function () {
        // Seed bonding curve with eth and update oracle
        const bondingCurve = contracts.bondingCurve
        const ethSeedAmount = tenPow18.mul(toBN(1000))
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
  
      it('should transfer allocation from bonding curve to compound and aave', async function () {
        const { bondingCurve, aaveEthPCVDeposit, compoundEthPCVDeposit } = contracts;
        
        await compoundEthPCVDeposit.deposit();
        const compoundETHBefore = await compoundEthPCVDeposit.balance()

        if ((await web3.eth.getBalance(aaveEthPCVDeposit.address)).toString() !== '0') {
          await aaveEthPCVDeposit.deposit();
        }
        const aaveETHBefore = await aaveEthPCVDeposit.balance()

        const curveEthBalanceBefore = toBN(await web3.eth.getBalance(bondingCurve.address));
        expect(curveEthBalanceBefore).to.be.bignumber.greaterThan(toBN(0))

        const fei = contracts.fei;
        const callerFeiBalanceBefore = await fei.balanceOf(deployAddress)
        const pcvAllocations = await bondingCurve.getAllocation()

        expect(pcvAllocations[0].length).to.be.equal(2)
  
        const durationWindow = await bondingCurve.duration()

        // pass the duration window, so Fei incentive will be sent
        await time.increase(durationWindow);

        const allocatedEth = await bondingCurve.balance()
        await bondingCurve.allocate()

        const curveEthBalanceAfter = toBN(await web3.eth.getBalance(bondingCurve.address));
        expect(curveEthBalanceAfter).to.be.bignumber.equal(curveEthBalanceBefore.sub(allocatedEth))
        
        const compoundETHAfter = await compoundEthPCVDeposit.balance()
        const aaveETHAfter = await aaveEthPCVDeposit.balance()
        await expectApprox(compoundETHAfter, compoundETHBefore.add(allocatedEth.div(toBN(2))), '100')
        await expectApprox(aaveETHAfter, aaveETHBefore.add(allocatedEth.div(toBN(2))), '100')

        const feiIncentive = await bondingCurve.incentiveAmount();
        const callerFeiBalanceAfter = await fei.balanceOf(deployAddress);
        expect(callerFeiBalanceAfter).to.be.bignumber.equal(callerFeiBalanceBefore.add(feiIncentive))
      })
    });

    describe('DPI', async function () {
      beforeEach(async function () {
        // Acquire DPI
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.indexCoopFusePoolDpiAddress]
        });
        const dpiSeedAmount = tenPow18.mul(toBN(10))

        await forceEth(contractAddresses.indexCoopFusePoolDpiAddress);
        await contracts.dpi.transfer(deployAddress, dpiSeedAmount.mul(toBN(2)), {from: contractAddresses.indexCoopFusePoolDpiAddress});

        // Seed bonding curve with dpi
        const bondingCurve = contracts.dpiBondingCurve
        // increase mint cap
        await bondingCurve.setMintCap(tenPow18.mul(tenPow18));

        await contracts.dpi.approve(bondingCurve.address, dpiSeedAmount.mul(toBN(2)));
        await bondingCurve.purchase(deployAddress, dpiSeedAmount)
      })

      it('should allow purchase of Fei through bonding curve', async function () {
        const bondingCurve = contracts.dpiBondingCurve;
        const fei = contracts.fei;
        const feiBalanceBefore = await fei.balanceOf(deployAddress);

        const dpiAmount = tenPow18; // 1 DPI
        const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
        const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

        // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
        const expected = dpiAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);

        await bondingCurve.purchase(deployAddress, dpiAmount);

        const feiBalanceAfter = await fei.balanceOf(deployAddress);
        const expectedFinalBalance = feiBalanceBefore.add(expected)
        expect(feiBalanceAfter).to.be.bignumber.equal(expectedFinalBalance);
      })

      it('should transfer allocation from bonding curve to the uniswap deposit and Fuse', async function () {
        const bondingCurve = contracts.dpiBondingCurve;
        const uniswapPCVDeposit = contracts.dpiUniswapPCVDeposit;
        const fusePCVDeposit = contracts.indexCoopFusePoolDpiPCVDeposit;

        const pcvAllocations = await bondingCurve.getAllocation()
        expect(pcvAllocations[0].length).to.be.equal(2)

        const pcvDepositBefore = await uniswapPCVDeposit.balance();
        const fuseBalanceBefore = await fusePCVDeposit.balance();

        const allocatedDpi = await bondingCurve.balance()
        await bondingCurve.allocate()

        const curveBalanceAfter = await bondingCurve.balance();
        await expectApprox(curveBalanceAfter, toBN(0), '100')

        const pcvDepositAfter = await uniswapPCVDeposit.balance()
        await expectApprox(pcvDepositAfter.sub(pcvDepositBefore), allocatedDpi.mul(toBN(9)).div(toBN(10)), '10')

        const fuseBalanceAfter = await fusePCVDeposit.balance();
        await expectApprox(fuseBalanceAfter.sub(fuseBalanceBefore), allocatedDpi.div(toBN(10)), '100')
      })
    });

    describe('DAI', async function () {
      beforeEach(async function () {
        // Acquire DAI
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.compoundDaiAddress]
        });
        const daiSeedAmount = tenPow18.mul(toBN(1000000)); // 1M DAI
        await forceEth(contractAddresses.compoundDaiAddress);
        await contracts.dai.transfer(deployAddress, daiSeedAmount, {from: contractAddresses.compoundDaiAddress});
      
        const bondingCurve = contracts.daiBondingCurve;
        // increase mint cap
        await bondingCurve.setMintCap(tenPow18.mul(tenPow18));
      })

      it('should allow purchase of Fei through bonding curve', async function () {
        const bondingCurve = contracts.daiBondingCurve;
        const fei = contracts.fei;
        const feiBalanceBefore = await fei.balanceOf(deployAddress);

        const daiAmount = tenPow18.mul(toBN(1000000));; // 1M DAI
        const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
        const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

        // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
        const expected = daiAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);

        await contracts.dai.approve(bondingCurve.address, daiAmount);
        await bondingCurve.purchase(deployAddress, daiAmount);

        const feiBalanceAfter = await fei.balanceOf(deployAddress);
        const expectedFinalBalance = feiBalanceBefore.add(expected);
        expectApprox(feiBalanceAfter, expectedFinalBalance);
      })

      it('should transfer allocation from bonding curve to the compound deposit', async function () {
        const bondingCurve = contracts.daiBondingCurve;
        const compoundPCVDeposit = contracts.compoundDaiPCVDeposit;

        const pcvAllocations = await bondingCurve.getAllocation();
        expect(pcvAllocations[0].length).to.be.equal(1);

        const pcvDepositBefore = await compoundPCVDeposit.balance();

        const allocatedDai = await bondingCurve.balance();
        await bondingCurve.allocate();

        const curveBalanceAfter = await bondingCurve.balance();
        await expectApprox(curveBalanceAfter, toBN(0), '100')

        const pcvDepositAfter = await compoundPCVDeposit.balance();
        await expectApprox(pcvDepositAfter.sub(pcvDepositBefore), allocatedDai, '100');
      })
    });

    describe('RAI', async function () {
      beforeEach(async function () {
        // Acquire RAI
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.reflexerStableAssetFusePoolRaiAddress]
        });
        const raiSeedAmount = tenPow18.mul(toBN(1000))

        await forceEth(contractAddresses.reflexerStableAssetFusePoolRaiAddress);
        await contracts.rai.transfer(deployAddress, raiSeedAmount.mul(toBN(2)), {from: contractAddresses.reflexerStableAssetFusePoolRaiAddress});
        
        // Seed bonding curve with rai
        const bondingCurve = contracts.raiBondingCurve
        
        await contracts.rai.approve(bondingCurve.address, raiSeedAmount.mul(toBN(2)));
        await bondingCurve.purchase(deployAddress, raiSeedAmount)
      })
  
      it('should allow purchase of Fei through bonding curve', async function () {
        const bondingCurve = contracts.raiBondingCurve;
        const fei = contracts.fei;
        const feiBalanceBefore = await fei.balanceOf(deployAddress);

        const raiAmount = tenPow18; // 1 RAI
        const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
        const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

        // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
        const expected = raiAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);

        await bondingCurve.purchase(deployAddress, raiAmount);

        const feiBalanceAfter = await fei.balanceOf(deployAddress);
        const expectedFinalBalance = feiBalanceBefore.add(expected)
        expect(feiBalanceAfter).to.be.bignumber.equal(expectedFinalBalance);
      })

      it('should transfer allocation from bonding curve to Fuse', async function () {
        const bondingCurve = contracts.raiBondingCurve;
        const fusePCVDeposit = contracts.reflexerStableAssetFusePoolRaiPCVDeposit;
        const fuseBalanceBefore = await fusePCVDeposit.balance();

        const aaveRaiPCVDeposit = contracts.aaveRaiPCVDeposit
        const aaveBalanceBefore = await aaveRaiPCVDeposit.balance();

        const pcvAllocations = await bondingCurve.getAllocation()
        expect(pcvAllocations[0].length).to.be.equal(2)
        
        const allocatedRai = await bondingCurve.balance()
        await bondingCurve.allocate()

        // All RAI were allocated
        const curveBalanceAfter = await bondingCurve.balance();
        expect(curveBalanceAfter).to.be.bignumber.equal(toBN(0))

        const fuseBalanceAfter = await fusePCVDeposit.balance();
        const aaveBalanceAfter = await aaveRaiPCVDeposit.balance();

        // Half allocated to fuse, half to aave
        await expectApprox(fuseBalanceAfter.sub(fuseBalanceBefore), allocatedRai.div(toBN(2)), '100')
        await expectApprox(aaveBalanceAfter.sub(aaveBalanceBefore), allocatedRai.div(toBN(2)), '100')
      })
    });
  });

  describe('StableSwapOperatorV1', async function() {
    it('should properly withdraw ~1M DAI to self', async function () {
      const daiBalanceBefore = await contracts.dai.balanceOf(contracts.curveMetapoolDeposit.address);
      //console.log('daiBalanceBefore', daiBalanceBefore / 1e18);
      await contracts.curveMetapoolDeposit.withdraw(contracts.curveMetapoolDeposit.address, tenPow18.mul(toBN(1e6)));
      const daiBalanceAfter = await contracts.dai.balanceOf(contracts.curveMetapoolDeposit.address);
      //console.log('daiBalanceAfter', daiBalanceAfter / 1e18);
      const daiBalanceWithdrawn = daiBalanceAfter.sub(daiBalanceBefore);
      //console.log('daiBalanceWithdrawn', daiBalanceWithdrawn / 1e18);
      await expectApprox(daiBalanceWithdrawn, tenPow18.mul(toBN(1e6)), '1000');
    });
    it('should properly re-deposit ~1M DAI just withdrawn', async function () {
      const daiBalanceBefore = await contracts.dai.balanceOf(contracts.curveMetapoolDeposit.address);
      const balanceBefore = await contracts.curveMetapoolDeposit.balance();
      //console.log('daiBalanceBefore', daiBalanceBefore / 1e18);
      //console.log('balanceBefore', balanceBefore / 1e18);
      await expectApprox(daiBalanceBefore, tenPow18.mul(toBN(1e6)), '1000');
      await contracts.curveMetapoolDeposit.deposit();
      const daiBalanceAfter = await contracts.dai.balanceOf(contracts.curveMetapoolDeposit.address);
      expect(daiBalanceAfter).to.be.bignumber.equal('0');
      //console.log('daiBalanceAfter', daiBalanceAfter / 1e18);
      const balanceAfter = await contracts.curveMetapoolDeposit.balance();
      const balanceChange = balanceAfter.sub(balanceBefore);
      //console.log('balanceChange', balanceChange / 1e18);
      //console.log('balanceAfter', balanceAfter / 1e18);
      await expectApprox(balanceChange, tenPow18.mul(toBN(1e6)), '1000');
    });
  });

  it('should be able to redeem Fei from stabiliser', async function () {
    const fei = contracts.fei;
    const reserveStabilizer = contracts.ethReserveStabilizer;
    await web3.eth.sendTransaction({from: deployAddress, to: reserveStabilizer.address, value: tenPow18.mul(toBN(200))});

    const contractEthBalanceBefore = toBN(await web3.eth.getBalance(reserveStabilizer.address))
    const userFeiBalanceBefore = toBN(await fei.balanceOf(deployAddress))

    const feiTokensExchange = toBN(40000000000000)
    await reserveStabilizer.updateOracle();
    const expectedAmountOut = await reserveStabilizer.getAmountOut(feiTokensExchange)
    await reserveStabilizer.exchangeFei(feiTokensExchange)

    const contractEthBalanceAfter = toBN(await web3.eth.getBalance(reserveStabilizer.address))
    const userFeiBalanceAfter = toBN(await fei.balanceOf(deployAddress))

    expect(contractEthBalanceBefore.sub(toBN(expectedAmountOut))).to.be.bignumber.equal(contractEthBalanceAfter)
    expect(userFeiBalanceAfter).to.be.bignumber.equal(userFeiBalanceBefore.sub(feiTokensExchange))
  })

  describe('Optimistic Approval', async () => {
    beforeEach(async function () {
      const { tribalChiefOptimisticMultisigAddress, timelockAddress } = contractAddresses;
      const { tribalChiefOptimisticTimelock } = contracts;

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [tribalChiefOptimisticMultisigAddress]
      });

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [timelockAddress]
      });

      await web3.eth.sendTransaction({from: deployAddress, to: tribalChiefOptimisticMultisigAddress, value: '40000000000000000'});

    });
    it('governor can cancel a proposal', async () => {
      const { tribalChiefOptimisticMultisigAddress, timelockAddress } = contractAddresses;
      const { tribalChiefOptimisticTimelock } = contracts;

      await tribalChiefOptimisticTimelock.queueTransaction(deployAddress, 0, 'sig()', '0x', '10000000000000000', {from: tribalChiefOptimisticMultisigAddress});
      const hash = await tribalChiefOptimisticTimelock.getTxHash(deployAddress, 0, 'sig()', '0x', '10000000000000000');
      expect(await tribalChiefOptimisticTimelock.queuedTransactions(hash)).to.be.true;

      await tribalChiefOptimisticTimelock.vetoTransactions([deployAddress], [0], ['sig()'], ['0x'], ['10000000000000000'], {from: timelockAddress});
      
      expect(await tribalChiefOptimisticTimelock.queuedTransactions(hash)).to.be.false;
    });

    it('proposal can execute on tribalChief', async () => {
      const { tribalChiefOptimisticMultisigAddress } = contractAddresses;
      const { tribalChiefOptimisticTimelock, tribalChief } = contracts;

      const oldBlockReward = await tribalChief.tribePerBlock();

      await tribalChiefOptimisticTimelock.queueTransaction(tribalChief.address, 0, 'updateBlockReward(uint256)', '0x0000000000000000000000000000000000000000000000000000000000000001', '100000000000', {from: tribalChiefOptimisticMultisigAddress});
      const hash = await tribalChiefOptimisticTimelock.getTxHash(tribalChief.address, 0, 'updateBlockReward(uint256)', '0x0000000000000000000000000000000000000000000000000000000000000001', '100000000000');
      expect(await tribalChiefOptimisticTimelock.queuedTransactions(hash)).to.be.true;
      
      await time.increaseTo('100000000000');
      await tribalChiefOptimisticTimelock.executeTransaction(tribalChief.address, 0, 'updateBlockReward(uint256)', '0x0000000000000000000000000000000000000000000000000000000000000001', '100000000000', {from: tribalChiefOptimisticMultisigAddress});

      expect(await tribalChief.tribePerBlock()).to.be.bignumber.equal('1');
      expect(await tribalChiefOptimisticTimelock.queuedTransactions(hash)).to.be.false;
    
      await tribalChief.updateBlockReward(oldBlockReward);
    });
  });

  describe('Drip Controller', async () => {
    it('drip controller can withdraw from PCV deposit to stabiliser', async function () {
      const ethReserveStabilizer = contracts.ethReserveStabilizer
      const aaveEthPCVDeposit = contracts.aaveEthPCVDeposit
      const pcvDripper = contracts.aaveEthPCVDripController;
      const fei = contracts.fei
  
      const userFeiBalanceBefore = await fei.balanceOf(deployAddress)
      let stabilizerBalanceBefore = await ethReserveStabilizer.balance()
  
      const dripAmount = await pcvDripper.dripAmount();
      if (stabilizerBalanceBefore.gt(dripAmount)) {
        await ethReserveStabilizer.withdraw(deployAddress, stabilizerBalanceBefore);
        stabilizerBalanceBefore = await ethReserveStabilizer.balance()
      }
  
      const pcvDepositBefore = await aaveEthPCVDeposit.balance()
      // Trigger drip
      await time.increase(await pcvDripper.remainingTime());
      await pcvDripper.drip({from: deployAddress});
  
      // Check PCV deposit loses dripAmount ETH and stabilizer gets dripAmount ETH
      const pcvDepositAfter = toBN(await aaveEthPCVDeposit.balance())
      await expectApprox(pcvDepositAfter, pcvDepositBefore.sub(dripAmount), '100')
  
      const stabilizerBalanceAfter = toBN(await ethReserveStabilizer.balance())
      await expectApprox(stabilizerBalanceAfter, stabilizerBalanceBefore.add(dripAmount), '100')
  
      const feiIncentive = await pcvDripper.incentiveAmount()
  
      const userFeiBalanceAfter = await fei.balanceOf(deployAddress)
      expectApprox(userFeiBalanceAfter, userFeiBalanceBefore.add(feiIncentive));
    })
  });

  describe('Compound', async () => {
    it('should be able to deposit and withdraw ERC20 tokens',  async function () {
      const erc20CompoundPCVDeposit = contracts.rariPool8FeiPCVDeposit;
      const fei = contracts.fei;
      const amount = '100000000000000000000000000'
      await fei.mint(erc20CompoundPCVDeposit.address, amount);

      const balanceBefore = await erc20CompoundPCVDeposit.balance();

      await erc20CompoundPCVDeposit.deposit();
      expectApprox((await erc20CompoundPCVDeposit.balance()).sub(balanceBefore), amount, '100');

      await erc20CompoundPCVDeposit.withdraw(deployAddress, amount);
      expect((await erc20CompoundPCVDeposit.balance()).sub(balanceBefore)).to.be.bignumber.lessThan(amount);
    })

    it('should be able to deposit and withdraw ETH',  async function () {
      const ethCompoundPCVDeposit = contracts.compoundEthPCVDeposit;
      const amount = tenPow18.mul(toBN(200));
      await ethCompoundPCVDeposit.deposit();

      await web3.eth.sendTransaction({from: deployAddress, to: ethCompoundPCVDeposit.address, value: amount });

      const balanceBefore = await ethCompoundPCVDeposit.balance();

      await ethCompoundPCVDeposit.deposit();
      expectApprox((await ethCompoundPCVDeposit.balance()).sub(balanceBefore), amount, '100');

      await ethCompoundPCVDeposit.withdraw(deployAddress, amount);
      expect((await ethCompoundPCVDeposit.balance()).sub(balanceBefore)).to.be.bignumber.lessThan(amount);
    })
  })

  describe('Aave', async () => {
    it('should be able to deposit and withdraw ETH',  async function () {
      const aaveEthPCVDeposit = contracts.aaveEthPCVDeposit;
      const amount = tenPow18.mul(toBN(200));

      try { 
        await aaveEthPCVDeposit.deposit();
      } catch (e) {

      }

      await web3.eth.sendTransaction({from: deployAddress, to: aaveEthPCVDeposit.address, value: amount });

      const balanceBefore = await aaveEthPCVDeposit.balance();

      await aaveEthPCVDeposit.deposit();
      expectApprox((await aaveEthPCVDeposit.balance()).sub(balanceBefore), amount, '100');

      await aaveEthPCVDeposit.withdraw(deployAddress, amount);

      expect((await aaveEthPCVDeposit.balance()).sub(balanceBefore)).to.be.bignumber.lessThan(amount);
    })

    it('should be able to earn and claim stAAVE', async () => {
      const aaveEthPCVDeposit = contracts.aaveEthPCVDeposit;
      const amount = tenPow18.mul(toBN(200));
      await web3.eth.sendTransaction({from: deployAddress, to: aaveEthPCVDeposit.address, value: amount });

      const aaveBalanceBefore = await contracts.stAAVE.balanceOf(aaveEthPCVDeposit.address);
      await aaveEthPCVDeposit.deposit();

      await aaveEthPCVDeposit.claimRewards();
      const aaveBalanceAfter = await contracts.stAAVE.balanceOf(aaveEthPCVDeposit.address);

      expect(aaveBalanceAfter.sub(aaveBalanceBefore)).to.be.bignumber.greaterThan(toBN(0));
    });
  })

  describe('Access control', async () => {
    before(async () => {
      // Revoke deploy address permissions, so that does not erroneously
      // contribute to num governor roles etc
      await e2eCoord.revokeDeployAddressPermission()
    })

    it('should have granted correct role cardinality', async function () {
      const core = contracts.core
      const accessRights = e2eCoord.getAccessControlMapping()

      const minterId = await core.MINTER_ROLE()
      const numMinterRoles = await core.getRoleMemberCount(minterId)
      expect(numMinterRoles.toNumber()).to.be.equal(accessRights.minter.length)

      const burnerId = await core.BURNER_ROLE()
      const numBurnerRoles = await core.getRoleMemberCount(burnerId)
      expect(numBurnerRoles.toNumber()).to.be.equal(accessRights.burner.length)

      const pcvControllerId = await core.PCV_CONTROLLER_ROLE()
      const numPCVControllerRoles = await core.getRoleMemberCount(pcvControllerId)
      expect(numPCVControllerRoles.toNumber()).to.be.equal(accessRights.pcvController.length)

      const governorId = await core.GOVERN_ROLE()
      const numGovernorRoles = await core.getRoleMemberCount(governorId)
      expect(numGovernorRoles.toNumber()).to.be.equal(accessRights.governor.length)

      const guardianId = await core.GUARDIAN_ROLE()
      const numGuaridanRoles = await core.getRoleMemberCount(guardianId)
      expect(numGuaridanRoles.toNumber()).to.be.equal(accessRights.guardian.length)
    })

    it('should have granted contracts correct roles', async function () {
      const core = contracts.core;
      const accessControl = e2eCoord.getAccessControlMapping()

      for (let i = 0; i < accessControl.minter.length; i += 1) {
        const contractAddress = accessControl.minter[i]
        const isMinter = await core.isMinter(contractAddress)
        expect(isMinter).to.be.equal(true)
      }

      for (let i = 0; i < accessControl.burner.length; i += 1) {
        const contractAddress = accessControl.burner[i]
        const isBurner = await core.isBurner(contractAddress)
        expect(isBurner).to.be.equal(true)
      }

      for (let i = 0; i < accessControl.pcvController.length; i += 1) {
        const contractAddress = accessControl.pcvController[i]
        const isPCVController = await core.isPCVController(contractAddress)
        expect(isPCVController).to.be.equal(true)
      }

      for (let i = 0; i < accessControl.guardian.length; i += 1) {
      const contractAddress = accessControl.guardian[i]
        const isGuardian = await core.isGuardian(contractAddress)
        expect(isGuardian).to.be.equal(true)
      }

      for (let i = 0; i < accessControl.governor.length; i += 1) {
        const contractAddress = accessControl.governor[i]
        const isGovernor = await core.isGovernor(contractAddress)
        expect(isGovernor).to.be.equal(true)
      }

      const tribe = contracts.tribe
      const tribeMinter = await tribe.minter()
      expect(tribeMinter).to.equal(contractAddresses.tribeReserveStabilizerAddress)
    })
  })

  describe('TribalChief', async () => {
    async function testMultipleUsersPooling(
      tribalChief,
      lpToken,
      userAddresses,
      incrementAmount,
      blocksToAdvance,
      lockLength,
      totalStaked,
      pid,
    ) {
      // if lock length isn't defined, it defaults to 0
      lockLength = lockLength === undefined ? 0 : lockLength;

      // approval loop
      for (let i = 0; i < userAddresses.length; i++) {
        await lpToken.approve(tribalChief.address, uintMax, { from: userAddresses[i] });
      }

      // deposit loop
      for (let i = 0; i < userAddresses.length; i++) {
        let lockBlockAmount = lockLength;
        if (Array.isArray(lockLength)) {
          lockBlockAmount = lockLength[i];
          if (lockLength.length !== userAddresses.length) {
            throw new Error('invalid lock length');
          }
        }

        const currentIndex = await tribalChief.openUserDeposits(pid, userAddresses[i]);
        expectEvent(
          await tribalChief.deposit(
            pid,
            totalStaked,
            lockBlockAmount,
            { from: userAddresses[i] },
          ),
          'Deposit', {
            user: userAddresses[i],
            pid: new BN(pid.toString()),
            amount: new BN(totalStaked),
            depositID: currentIndex,
          },
        );
      }

      const pendingBalances = [];
      for (let i = 0; i < userAddresses.length; i++) {
        const balance = new BN(await tribalChief.pendingRewards(pid, userAddresses[i]));
        pendingBalances.push(balance);
      }

      for (let i = 0; i < blocksToAdvance; i++) {
        for (let j = 0; j < pendingBalances.length; j++) {
          pendingBalances[j] = new BN(await tribalChief.pendingRewards(pid, userAddresses[j]));
        }

        await time.advanceBlock();

        for (let j = 0; j < userAddresses.length; j++) {
          let userIncrementAmount = incrementAmount;
          if (Array.isArray(incrementAmount)) {
            userIncrementAmount = incrementAmount[j];
            if (incrementAmount.length !== userAddresses.length) {
              throw new Error('invalid increment amount length');
            }
          }

          await expectApprox(
            new BN(await tribalChief.pendingRewards(pid, userAddresses[j])),
            pendingBalances[j].add(userIncrementAmount),
          );
        }
      }
    }

    async function unstakeAndHarvestAllPositions(userAddresses, pid, tribalChief, stakedToken) {
      for (let i = 0; i < userAddresses.length; i++) {
        const address = userAddresses[i];
        const startingStakedTokenBalance = await stakedToken.balanceOf(address);
        const { virtualAmount } = await tribalChief.userInfo(pid, address);
        const stakedTokens = await tribalChief.getTotalStakedInPool(pid, address);

        await tribalChief.withdrawAllAndHarvest(pid, address, { from: address });

        if (virtualAmount.toString() !== '0') {
          const afterStakedTokenBalance = await stakedToken.balanceOf(address);
          expect(afterStakedTokenBalance).to.be.bignumber.equal(startingStakedTokenBalance.add(stakedTokens));
        }
      }
    }

    describe('FeiTribe LP Token Staking', async () => {
      const feiTribeLPTokenOwner = '0x7D809969f6A04777F0A87FF94B57E56078E5fE0F';
      const feiTribeLPTokenOwnerNumberFour = '0xEc0AB4ED27f6dEF15165Fede40EebdcB955B710D';
      const feiTribeLPTokenOwnerNumberFive = '0x2464E8F7809c05FCd77C54292c69187Cb66FE294';
      const totalStaked = '100000000000000000000';

      let uniFeiTribe;
      let tribalChief;
      let tribePerBlock;
      let tribe;

      before(async function () {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [feiTribeLPTokenOwner],
        });

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [feiTribeLPTokenOwnerNumberFour],
        });

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [feiTribeLPTokenOwnerNumberFive],
        });

        // const { feiTribePairAddress }  = contractAddresses; 
        uniFeiTribe = contracts.feiTribePair;
        tribalChief = contracts.tribalChief;
        tribePerBlock = await tribalChief.tribePerBlock();
        tribe = contracts.tribe;
        await forceEth(feiTribeLPTokenOwner);
      });

      afterEach(async function () {});

      it('find uni fei/tribe LP balances', async function () {
        expect(await uniFeiTribe.balanceOf(feiTribeLPTokenOwner)).to.be.bignumber.gt(new BN(0));
        expect(await uniFeiTribe.balanceOf(feiTribeLPTokenOwnerNumberFour)).to.be.bignumber.gt(new BN(0));
        expect(await uniFeiTribe.balanceOf(feiTribeLPTokenOwnerNumberFive)).to.be.bignumber.gt(new BN(0));
      });

      it('stakes uniswap fei/tribe LP tokens', async function () {
        const pid = 0;

        const perBlockReward = tribePerBlock.div(await tribalChief.numPools());
        await uniFeiTribe.approve(tribalChief.address, totalStaked, { from: feiTribeLPTokenOwner });
        await tribalChief.deposit(pid, totalStaked, 0, { from: feiTribeLPTokenOwner });

        const advanceBlockAmount = 3;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(
          Number(await tribalChief.pendingRewards(pid, feiTribeLPTokenOwner)),
        ).to.be.equal(perBlockReward * advanceBlockAmount);

        await tribalChief.harvest(pid, feiTribeLPTokenOwner, { from: feiTribeLPTokenOwner });

        // add on one to the advance block amount as we have
        // advanced one more block when calling the harvest function
        expect(
          Number(await tribe.balanceOf(feiTribeLPTokenOwner)),
        ).to.be.equal(perBlockReward * (advanceBlockAmount + 1));
        // now withdraw from deposit to clear the setup for the next test
        await unstakeAndHarvestAllPositions([feiTribeLPTokenOwner], pid, tribalChief, uniFeiTribe);
      });

      it('multiple users stake uniswap fei/tribe LP tokens', async function () {
        const userAddresses = [feiTribeLPTokenOwner, feiTribeLPTokenOwnerNumberFour]
        const userPerBlockReward = tribePerBlock.div(await tribalChief.numPools()).div(new BN(userAddresses.length));      
        const pid = 0;

        await testMultipleUsersPooling(
          tribalChief,
          uniFeiTribe,
          userAddresses,
          userPerBlockReward,
          1,
          0,
          totalStaked,
          pid,
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const pendingTribe = await tribalChief.pendingRewards(pid, userAddresses[i]);

          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = new BN(totalStaked);
          const poolStakedAmount = await tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.bignumber.equal(poolStakedAmount);
          const startingUniLPTokenBalance = await uniFeiTribe.balanceOf(userAddresses[i])
          const startingTribeBalance = await tribe.balanceOf(userAddresses[i])

          await tribalChief.withdrawAllAndHarvest(
            pid, userAddresses[i], { from: userAddresses[i] },
          );

          expect(
            await uniFeiTribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.equal(new BN(totalStaked).add(startingUniLPTokenBalance));

          expect(
            await tribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.gt(pendingTribe.add(startingTribeBalance));
        }
        // withdraw from deposit to clear the setup for the next test
        await unstakeAndHarvestAllPositions(userAddresses, pid, tribalChief, uniFeiTribe);
      });

      it('multiple users stake uniswap fei/tribe LP tokens, one user calls emergency withdraw and loses all reward debt', async function () {
        const userAddresses = [feiTribeLPTokenOwner, feiTribeLPTokenOwnerNumberFour, feiTribeLPTokenOwnerNumberFive]
        const userPerBlockReward = tribePerBlock.div(await tribalChief.numPools()).div(new BN(userAddresses.length));
        const pid = 0;

        await testMultipleUsersPooling(
          tribalChief,
          uniFeiTribe,
          userAddresses,
          userPerBlockReward,
          1,
          0,
          totalStaked,
          pid,
        );

        const startingUniLPTokenBalance = await uniFeiTribe.balanceOf(feiTribeLPTokenOwnerNumberFive);
        const { virtualAmount } = await tribalChief.userInfo(pid, feiTribeLPTokenOwnerNumberFive);

        await tribalChief.emergencyWithdraw(pid, feiTribeLPTokenOwnerNumberFive, { from: feiTribeLPTokenOwnerNumberFive });

        const endingUniLPTokenBalance = await uniFeiTribe.balanceOf(feiTribeLPTokenOwnerNumberFive);
        expect(startingUniLPTokenBalance.add(virtualAmount)).to.be.bignumber.equal(endingUniLPTokenBalance);
        const { rewardDebt } = await tribalChief.userInfo(pid, feiTribeLPTokenOwnerNumberFive);
        expect(rewardDebt).to.be.bignumber.equal(new BN(0));

        // remove user 5 from userAddresses array
        userAddresses.pop();
        for (let i = 0; i < userAddresses.length; i++) {
          const pendingTribe = await tribalChief.pendingRewards(pid, userAddresses[i]);

          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = new BN(totalStaked);
          const poolStakedAmount = await tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.bignumber.equal(poolStakedAmount);
          const startingUniLPTokenBalance = await uniFeiTribe.balanceOf(userAddresses[i])
          const startingTribeBalance = await tribe.balanceOf(userAddresses[i])

          await tribalChief.withdrawAllAndHarvest(
            pid, userAddresses[i], { from: userAddresses[i] },
          );

          expect(
            await uniFeiTribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.equal(new BN(totalStaked).add(startingUniLPTokenBalance));

          expect(
            await tribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.gt(pendingTribe.add(startingTribeBalance));
        }
        // withdraw from deposit to clear the setup for the next test
        await unstakeAndHarvestAllPositions(userAddresses, pid, tribalChief, uniFeiTribe);
      });
    });

    describe('FEICRV3Metapool', async () => {
      const CRVMetaPoolLPTokenOwner = '0x9544A83A8cB74062c836AA11565d4BB4A54fe40D';
      const feiTribeLPTokenOwner = '0x7D809969f6A04777F0A87FF94B57E56078E5fE0F';
      const totalStaked = '100000000000000000000';

      let tribalChief;
      let tribePerBlock;
      let tribe;
      let crvMetaPool;

      before(async function () {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [CRVMetaPoolLPTokenOwner],
        });

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [feiTribeLPTokenOwner],
        });

        tribalChief = contracts.tribalChief;
        tribePerBlock = await tribalChief.tribePerBlock();
        tribe = contracts.tribe;
        crvMetaPool = contracts.curve3Metapool;
      });

      it('balance check CRV tokens', async function () {
        expect(await crvMetaPool.balanceOf(CRVMetaPoolLPTokenOwner)).to.be.bignumber.gt(new BN(0));
      });

      it('can stake CRV tokens', async function () {
        const pid = 1;

        const perBlockReward = tribePerBlock.div(await tribalChief.numPools());
        await crvMetaPool.approve(tribalChief.address, totalStaked, { from: CRVMetaPoolLPTokenOwner });
        await tribalChief.deposit(pid, totalStaked, 0, { from: CRVMetaPoolLPTokenOwner });

        const advanceBlockAmount = 3;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(
          Number(await tribalChief.pendingRewards(pid, CRVMetaPoolLPTokenOwner)),
        ).to.be.equal(perBlockReward * advanceBlockAmount);
        
        const startingTribeBalance = await tribe.balanceOf(CRVMetaPoolLPTokenOwner);
        await tribalChief.harvest(pid, CRVMetaPoolLPTokenOwner, { from: CRVMetaPoolLPTokenOwner });

        const tribeDelta = (await tribe.balanceOf(CRVMetaPoolLPTokenOwner)).sub(startingTribeBalance);
        // add on one to the advance block amount as we have
        // advanced one more block when calling the harvest function
        expect(tribeDelta).to.be.bignumber.equal(perBlockReward.mul(new BN(advanceBlockAmount + 1)));
        // now withdraw from deposit to clear the setup for the next test
        await unstakeAndHarvestAllPositions([CRVMetaPoolLPTokenOwner], pid, tribalChief, crvMetaPool);
      });

      it('can stake CRV tokens, then withdrawFromDeposit', async function () {
        const pid = 1;

        const perBlockReward = tribePerBlock.div(await tribalChief.numPools());
        await crvMetaPool.approve(tribalChief.address, totalStaked, { from: CRVMetaPoolLPTokenOwner });
        await tribalChief.deposit(pid, totalStaked, 0, { from: CRVMetaPoolLPTokenOwner });

        const advanceBlockAmount = 3;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(
          Number(await tribalChief.pendingRewards(pid, CRVMetaPoolLPTokenOwner)),
        ).to.be.equal(perBlockReward * advanceBlockAmount);
        
        let startingTribeBalance = await tribe.balanceOf(CRVMetaPoolLPTokenOwner);
        await tribalChief.harvest(pid, CRVMetaPoolLPTokenOwner, { from: CRVMetaPoolLPTokenOwner });

        {
          const tribeDelta = (await tribe.balanceOf(CRVMetaPoolLPTokenOwner)).sub(startingTribeBalance);
          // add on one to the advance block amount as we have advanced one more block when calling the harvest function
          expect(tribeDelta).to.be.bignumber.equal(perBlockReward.mul(new BN(advanceBlockAmount + 1)));
        }
        const startingCRVLPTokenBalance = await crvMetaPool.balanceOf(CRVMetaPoolLPTokenOwner);
        await tribalChief.withdrawFromDeposit(pid, totalStaked, CRVMetaPoolLPTokenOwner, 0, { from: CRVMetaPoolLPTokenOwner });
        // now withdraw from deposit to clear the setup for the next test
        const endingCRVLpTokenBalance = await crvMetaPool.balanceOf(CRVMetaPoolLPTokenOwner);
        expect(startingCRVLPTokenBalance.add(new BN(totalStaked))).to.be.bignumber.equal(endingCRVLpTokenBalance);

        {
          startingTribeBalance = await tribe.balanceOf(CRVMetaPoolLPTokenOwner);
          await tribalChief.harvest(pid, CRVMetaPoolLPTokenOwner, { from: CRVMetaPoolLPTokenOwner });
          const tribeDelta = (await tribe.balanceOf(CRVMetaPoolLPTokenOwner)).sub(startingTribeBalance);
          // We only received rewards on the withdraw tx, not on the harvest tx
          expect(tribeDelta).to.be.bignumber.equal(perBlockReward);
          const { rewardDebt, virtualAmount } = await tribalChief.userInfo(pid, CRVMetaPoolLPTokenOwner);
          expect(rewardDebt).to.be.bignumber.equal(new BN(0));
          expect(virtualAmount).to.be.bignumber.equal(new BN(0));
        }
        // ensure that the virtual total supply got zero'd as well
        expect((await tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.bignumber.equal(new BN('0'));
        
        await unstakeAndHarvestAllPositions([CRVMetaPoolLPTokenOwner], pid, tribalChief, crvMetaPool);
        // ensure that user deposits got zero'd after calling withdrawAllAndHarvest
        expect(await tribalChief.openUserDeposits(pid, CRVMetaPoolLPTokenOwner)).to.be.bignumber.equal(new BN('0'));
      });
      
      it('can stake CRV tokens with multiple users', async function () {
        const pid = 1;
        const userAddresses = [feiTribeLPTokenOwner, CRVMetaPoolLPTokenOwner];
        const userPerBlockReward = tribePerBlock.div(await tribalChief.numPools()).div(new BN(userAddresses.length));

        await crvMetaPool.transfer(feiTribeLPTokenOwner, totalStaked, { from: CRVMetaPoolLPTokenOwner });
        await testMultipleUsersPooling(
          tribalChief,
          crvMetaPool,
          userAddresses,
          userPerBlockReward,
          1,
          0,
          totalStaked,
          pid,
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const pendingTribe = await tribalChief.pendingRewards(pid, userAddresses[i]);

          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = new BN(totalStaked);
          const poolStakedAmount = await tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.bignumber.equal(poolStakedAmount);
          const startingUniLPTokenBalance = await crvMetaPool.balanceOf(userAddresses[i])
          const startingTribeBalance = await tribe.balanceOf(userAddresses[i])

          await tribalChief.withdrawAllAndHarvest(
            pid, userAddresses[i], { from: userAddresses[i] },
          );

          expect(
            await crvMetaPool.balanceOf(userAddresses[i]),
          ).to.be.bignumber.equal(new BN(totalStaked).add(startingUniLPTokenBalance));

          expect(
            await tribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.gt(pendingTribe.add(startingTribeBalance));
        }
        // withdraw from deposit to clear the setup for the next test
        await unstakeAndHarvestAllPositions(userAddresses, pid, tribalChief, crvMetaPool);
      });

      it('can stake CRV tokens, one user calls emergency withdraw and loses all reward debt', async function () {
        const pid = 1;
        const userAddresses = [feiTribeLPTokenOwner, CRVMetaPoolLPTokenOwner];
        const userPerBlockReward = tribePerBlock.div(await tribalChief.numPools()).div(new BN(userAddresses.length));

        await crvMetaPool.transfer(feiTribeLPTokenOwner, totalStaked, { from: CRVMetaPoolLPTokenOwner });
        await testMultipleUsersPooling(
          tribalChief,
          crvMetaPool,
          userAddresses,
          userPerBlockReward,
          1,
          0,
          totalStaked,
          pid,
        );

        const startingUniLPTokenBalance = await crvMetaPool.balanceOf(CRVMetaPoolLPTokenOwner);
        const { virtualAmount } = await tribalChief.userInfo(pid, CRVMetaPoolLPTokenOwner);

        await tribalChief.emergencyWithdraw(pid, CRVMetaPoolLPTokenOwner, { from: CRVMetaPoolLPTokenOwner });

        const endingUniLPTokenBalance = await crvMetaPool.balanceOf(CRVMetaPoolLPTokenOwner);
        expect(startingUniLPTokenBalance.add(virtualAmount)).to.be.bignumber.equal(endingUniLPTokenBalance);
        const { rewardDebt } = await tribalChief.userInfo(pid, CRVMetaPoolLPTokenOwner);
        expect(rewardDebt).to.be.bignumber.equal(new BN(0));

        // remove CRVMetaPoolLPTokenOwner from userAddresses array
        userAddresses.pop();
        for (let i = 0; i < userAddresses.length; i++) {
          const pendingTribe = await tribalChief.pendingRewards(pid, userAddresses[i]);

          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = new BN(totalStaked);
          const poolStakedAmount = await tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.bignumber.equal(poolStakedAmount);
          const startingUniLPTokenBalance = await crvMetaPool.balanceOf(userAddresses[i])
          const startingTribeBalance = await tribe.balanceOf(userAddresses[i])

          await tribalChief.withdrawAllAndHarvest(
            pid, userAddresses[i], { from: userAddresses[i] },
          );

          expect(
            await crvMetaPool.balanceOf(userAddresses[i]),
          ).to.be.bignumber.equal(new BN(totalStaked).add(startingUniLPTokenBalance));

          expect(
            await tribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.gt(pendingTribe.add(startingTribeBalance));
        }
        // withdraw from deposit to clear the setup for the next test
        await unstakeAndHarvestAllPositions(userAddresses, pid, tribalChief, crvMetaPool);
      });
    });
  });

  describe('ERC20Dripper', async () => {
    let tribalChief;
    let tribePerBlock;
    let tribe;
    let dripper;
    let timelockAddress;
    let minter;

    before(async function () {
      dripper = contracts.erc20Dripper;
      tribalChief = contracts.tribalChief;
      tribePerBlock = await tribalChief.tribePerBlock();
      tribe = contracts.tribe;
      timelockAddress = contractAddresses.timelockAddress;
    });

    beforeEach(async function () {
      minter = await tribe.minter();
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [minter],
      });
      await forceEth(minter);

      await tribe.mint(dripper.address, dripAmount.mul(new BN(11)), { from: minter });
    });

    it('should be able to withdraw as PCV controller', async function () {
      const totalLockedTribe = await dripper.balance();
      const dripperStartingBalance = await tribe.balanceOf(dripper.address);
      await dripper.withdraw(
        tribalChief.address, totalLockedTribe, { from: timelockAddress }
      );
      const dripperEndingBalance = await tribe.balanceOf(dripper.address);

      expect(dripperEndingBalance).to.be.bignumber.equal(new BN(0));
      expect(dripperStartingBalance).to.be.bignumber.equal(totalLockedTribe);
    });


    it('should be able to call drip when enough time has passed through multiple periods', async function () {
      for (let i = 0; i < 11; i++) {
        await time.increase(dripFrequency);
  
        expect(await dripper.isTimeEnded()).to.be.true;

        const tribalChiefStartingBalance = await tribe.balanceOf(tribalChief.address);
        await dripper.drip();
        const tribalChiefEndingBalance = await tribe.balanceOf(tribalChief.address);

        expect(await dripper.isTimeEnded()).to.be.false;
        expect(tribalChiefStartingBalance.add(dripAmount)).to.be.bignumber.equal(tribalChiefEndingBalance);
      }
    });
  });
});
