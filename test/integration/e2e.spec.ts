import hre, { ethers } from 'hardhat';
import { time } from '@openzeppelin/test-helpers';
import { TestEndtoEndCoordinator } from './setup';
import { NamedAddresses, NamedContracts } from '../../types/types';
import { forceEth } from './setup/utils';
import { expectApprox } from '../../test/helpers';
import proposals from './proposals_config.json';
import { BigNumber, Contract } from 'ethers';
import chai from 'chai';
import { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { TransactionResponse } from '@ethersproject/providers';

before(() => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
});

const uintMax = ethers.constants.MaxUint256;
const toBN = ethers.BigNumber.from;

// We will drip 4 million tribe per week
const dripAmount = toBN(4000000).mul(toBN(10).pow(toBN(18)));
// number of seconds between allowed drips
// this is 1 week in seconds
const dripFrequency = 604800;

describe('e2e', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  const tenPow18 = toBN('1000000000000000000');

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('Fei DAO', function () {
    it('proposal succeeds', async function () {
      const feiDAO = contracts.feiDAO;

      const targets = [feiDAO.address, contractAddresses.daiBondingCurve];
      const values = [0, 0];
      const calldatas = [
        '0x70b0f660000000000000000000000000000000000000000000000000000000000000000a', // set voting delay 10
        '0xe1d92bf8000000000000000000000000000000000000000000000000000000000000000b' // set bonding curve duration 11
      ];
      const description = [];

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [contractAddresses.multisig]
      });

      const signer = await ethers.getSigner(contractAddresses.multisig);

      // Propose
      // note ethers.js requires using this notation when two overloaded methods exist)
      // https://docs.ethers.io/v5/migration/web3/#migration-from-web3-js--contracts--overloaded-functions
      await feiDAO
        .connect(signer)
        ['propose(address[],uint256[],bytes[],string)'](targets, values, calldatas, description);

      const pid = await feiDAO.hashProposal(targets, values, calldatas, ethers.utils.keccak256(description));

      await time.advanceBlock();

      // vote
      await feiDAO.connect(signer).castVote(pid, 1);

      // advance to end of voting period
      const endBlock = (await feiDAO.proposals(pid)).endBlock;
      await time.advanceBlockTo(endBlock.toString());

      // queue
      await feiDAO['queue(address[],uint256[],bytes[],bytes32)'](
        targets,
        values,
        calldatas,
        ethers.utils.keccak256(description)
      );

      await time.increase('1000000');

      // execute
      await feiDAO['execute(address[],uint256[],bytes[],bytes32)'](
        targets,
        values,
        calldatas,
        ethers.utils.keccak256(description)
      );

      expect((await feiDAO.votingDelay()).toString()).to.be.equal('10');
      expect((await contracts.daiBondingCurve.duration()).toString()).to.be.equal('11');
    });

    it('rollback succeeds', async function() {
      const { feiDAO, timelock, governorAlphaBackup } = contracts;
      const { multisig } = contractAddresses;

      const signer = await ethers.getSigner(multisig);
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [multisig]
      });

      const deadline = await feiDAO.ROLLBACK_DEADLINE();
      await feiDAO.connect(signer).__rollback(deadline);

      await time.increaseTo(deadline.toString());
      
      await feiDAO.__executeRollback()

      expect(await timelock.pendingAdmin()).to.be.equal(governorAlphaBackup.address);

      await governorAlphaBackup.connect(signer).__acceptAdmin();

      expect(await timelock.admin()).to.be.equal(governorAlphaBackup.address);
    });
  });
  describe('PCV Equity Minter + LBP', async function () {
    it('mints appropriate amount and swaps', async function () {
      const {
        pcvEquityMinter,
        collateralizationOracleWrapper,
        staticPcvDepositWrapper,
        feiTribeLBPSwapper,
        tribe,
        tribeSplitter
      } = contracts;

      await time.increase((await pcvEquityMinter.remainingTime()).toString());

      const pcvStats = await collateralizationOracleWrapper.pcvStats();

      if (pcvStats[2] < 0) {
        await staticPcvDepositWrapper.setBalance(pcvStats[0]);
      }
      await collateralizationOracleWrapper.update();

      const mintAmount = await pcvEquityMinter.mintAmount();

      const balancesBefore = await feiTribeLBPSwapper.getReserves();

      const splitterBalanceBefore = await tribe.balanceOf(tribeSplitter.address);

      await pcvEquityMinter.mint();

      const balancesAfter = await feiTribeLBPSwapper.getReserves();

      expectApprox(balancesBefore[0].add(mintAmount), balancesAfter[0]);
      expect(await feiTribeLBPSwapper.swapEndTime()).to.be.gt(toBN((await time.latest()).toString()));

      await time.increase((await pcvEquityMinter.duration()).toString());
      await pcvEquityMinter.mint();

      expect(await tribe.balanceOf(tribeSplitter.address)).to.be.gt(toBN(splitterBalanceBefore));
    });
  });

  describe('Collateralization Oracle', async function () {
    it('exempting an address removes from PCV stats', async function () {
      const { collateralizationOracle, compoundEthPCVDeposit } = contracts;

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
      await time.increase((await collateralizationOracleWrapper.remainingTime()).toString());

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.true;
      expect(await collateralizationOracleWrapper.isOutdated()).to.be.true;
      expect(await collateralizationOracleWrapper.isExceededDeviationThreshold()).to.be.false;

      // UpdateIfOutdated succeeds
      await collateralizationOracleWrapper.updateIfOutdated();

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.false;

      // Increase PCV balance to exceed deviation threshold
      const pcvStats = await collateralizationOracleWrapper.pcvStats();
      await staticPcvDepositWrapper.setBalance(pcvStats[0]);

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.true;
      expect(await collateralizationOracleWrapper.isOutdated()).to.be.false;
      expect(await collateralizationOracleWrapper.isExceededDeviationThreshold()).to.be.true;

      // Keeper is incentivized to update oracle
      await time.increase((await collateralizationOracleKeeper.MIN_MINT_FREQUENCY()).toString());
      await collateralizationOracleKeeper.mint();

      const incentive = await collateralizationOracleKeeper.incentiveAmount();
      expect(beforeBalance.add(incentive)).to.be.equal(await fei.balanceOf(deployAddress));

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.false;
    });
  });

  describe('TribeReserveStabilizer', async function () {
    it('mint TRIBE', async function () {
      const { tribeReserveStabilizer, tribe } = contracts;
      const tribeSupply = await tribe.totalSupply();
      const balanceBefore = await tribe.balanceOf(deployAddress);

      await tribeReserveStabilizer.mint(deployAddress, '100000');

      // Minting increases total supply and target balance
      expect(balanceBefore.add(toBN('100000'))).to.be.equal(await tribe.balanceOf(deployAddress));
      expect(tribeSupply.add(toBN('100000'))).to.be.equal(await tribe.totalSupply());
    });

    it('exchangeFei', async function () {
      const { fei, staticPcvDepositWrapper, tribe, tribeReserveStabilizer, collateralizationOracleWrapper } = contracts;

      await fei.mint(deployAddress, tenPow18.mul(tenPow18).mul(toBN(4)));
      await collateralizationOracleWrapper.update();

      const userFeiBalanceBefore = toBN(await fei.balanceOf(deployAddress));
      const userTribeBalanceBefore = await tribe.balanceOf(deployAddress);

      const feiTokensExchange = toBN(40000000000000);
      await tribeReserveStabilizer.updateOracle();
      const expectedAmountOut = await tribeReserveStabilizer.getAmountOut(feiTokensExchange);
      await tribeReserveStabilizer.exchangeFei(feiTokensExchange);

      const userFeiBalanceAfter = toBN(await fei.balanceOf(deployAddress));
      const userTribeBalanceAfter = await tribe.balanceOf(deployAddress);

      expect(userTribeBalanceAfter.sub(toBN(expectedAmountOut))).to.be.equal(userTribeBalanceBefore);
      expect(userFeiBalanceAfter.eq(userFeiBalanceBefore.sub(feiTokensExchange))).to.be.true;

      await staticPcvDepositWrapper.setBalance(tenPow18.mul(tenPow18).mul(toBN(10)));
      await collateralizationOracleWrapper.update();
      expect(await tribeReserveStabilizer.isCollateralizationBelowThreshold()).to.be.false;
    });
  });

  describe('TRIBE Splitter', async function () {
    it('splits TRIBE 3 ways', async function () {
      const { tribeSplitter, tribeReserveStabilizer, tribe, erc20Dripper, core } = contracts;

      await tribeSplitter.allocate();

      await core.allocateTribe(tribeSplitter.address, '1000000');

      const beforeBalanceStabilizer = await tribe.balanceOf(tribeReserveStabilizer.address);
      const beforeBalanceDripper = await tribe.balanceOf(erc20Dripper.address);
      const beforeBalanceCore = await tribe.balanceOf(core.address);

      await tribeSplitter.allocate();

      const afterBalanceStabilizer = await tribe.balanceOf(tribeReserveStabilizer.address);
      const afterBalanceDripper = await tribe.balanceOf(erc20Dripper.address);
      const afterBalanceCore = await tribe.balanceOf(core.address);

      expectApprox(beforeBalanceStabilizer.add(toBN('600000')), afterBalanceStabilizer);
      expectApprox(beforeBalanceDripper.add(toBN('200000')), afterBalanceDripper);
      expectApprox(beforeBalanceCore.add(toBN('200000')), afterBalanceCore);
    });
  });

  describe('Aave borrowing', async () => {
    it('grants rewards', async function () {
      const { aaveEthPCVDeposit, aaveLendingPool, aaveTribeIncentivesController, fei, tribe } = contracts;

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [aaveEthPCVDeposit.address]
      });

      await aaveEthPCVDeposit.withdrawERC20(await aaveEthPCVDeposit.aToken(), deployAddress, tenPow18.mul(toBN(10000)));

      const borrowAmount = tenPow18.mul(toBN(1000000)).toString();
      const balanceBefore = (await fei.balanceOf(deployAddress)).toString();

      // 1. Borrow
      doLogging && console.log(`Borrowing ${borrowAmount}`);
      await aaveLendingPool.borrow(fei.address, borrowAmount, 2, 0, deployAddress);

      expect(toBN((await fei.balanceOf(deployAddress)).toString())).to.be.equal(
        toBN(balanceBefore).add(toBN(borrowAmount))
      );

      doLogging && console.log('Getting reserve data...');
      const { variableDebtTokenAddress } = await aaveLendingPool.getReserveData(fei.address);

      // 2. Fast forward time
      await time.increase(100000);
      // 3. Get reward amount
      const rewardAmount: string = (
        await aaveTribeIncentivesController.getRewardsBalance([variableDebtTokenAddress], deployAddress)
      ).toString();
      expectApprox(rewardAmount, tenPow18.mul(toBN(25000)));
      // 4. Claim reward amount
      await aaveTribeIncentivesController.claimRewards([variableDebtTokenAddress], rewardAmount, deployAddress);

      expectApprox(rewardAmount, await tribe.balanceOf(deployAddress));
    });
  });

  describe('BondingCurve', async () => {
    describe('ETH', async function () {
      beforeEach(async function () {
        // Seed bonding curve with eth and update oracle
        const bondingCurve = contracts.bondingCurve;
        const ethSeedAmount = tenPow18.mul(toBN(1000));
        await bondingCurve.purchase(deployAddress, ethSeedAmount, { value: ethSeedAmount });
        await bondingCurve.updateOracle();
      });

      it('should allow purchase of Fei through bonding curve', async function () {
        const bondingCurve = contracts.bondingCurve;
        const fei = contracts.fei;
        const feiBalanceBefore = await fei.balanceOf(deployAddress);

        const ethAmount = tenPow18; // 1 ETH
        const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
        const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

        // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
        const expected = ethAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);

        await bondingCurve.purchase(deployAddress, ethAmount, { value: ethAmount });

        const feiBalanceAfter = await fei.balanceOf(deployAddress);
        const expectedFinalBalance = feiBalanceBefore.add(expected);
        expect(feiBalanceAfter.eq(expectedFinalBalance)).to.be.true;
      });

      it('should transfer allocation from bonding curve to compound and aave', async function () {
        const { bondingCurve, aaveEthPCVDeposit, compoundEthPCVDeposit } = contracts;

        await compoundEthPCVDeposit.deposit();
        const compoundETHBefore = await compoundEthPCVDeposit.balance();

        if ((await ethers.provider.getBalance(aaveEthPCVDeposit.address)).toString() !== '0') {
          await aaveEthPCVDeposit.deposit();
        }
        const aaveETHBefore = await aaveEthPCVDeposit.balance();

        const curveEthBalanceBefore = toBN(await ethers.provider.getBalance(bondingCurve.address));
        expect(curveEthBalanceBefore.gt(toBN(0))).to.be.true;

        const fei = contracts.fei;
        const callerFeiBalanceBefore = await fei.balanceOf(deployAddress);
        const pcvAllocations = await bondingCurve.getAllocation();

        expect(pcvAllocations[0].length).to.be.equal(2);

        const durationWindow = await bondingCurve.duration();

        // pass the duration window, so Fei incentive will be sent
        await time.increase(durationWindow.toString());

        const allocatedEth = await bondingCurve.balance();
        await bondingCurve.allocate();

        const curveEthBalanceAfter = toBN(await ethers.provider.getBalance(bondingCurve.address));
        expect(curveEthBalanceAfter.eq(curveEthBalanceBefore.sub(allocatedEth))).to.be.true;

        const compoundETHAfter = await compoundEthPCVDeposit.balance();
        const aaveETHAfter = await aaveEthPCVDeposit.balance();
        await expectApprox(compoundETHAfter, compoundETHBefore.add(allocatedEth.div(toBN(2))), '100');
        await expectApprox(aaveETHAfter, aaveETHBefore.add(allocatedEth.div(toBN(2))), '100');

        const feiIncentive = await bondingCurve.incentiveAmount();
        const callerFeiBalanceAfter = await fei.balanceOf(deployAddress);
        expect(callerFeiBalanceAfter.eq(callerFeiBalanceBefore.add(feiIncentive))).to.be.true;
      });
    });

    describe('DPI', async function () {
      beforeEach(async function () {
        // Acquire DPI
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.indexCoopFusePoolDpi]
        });

        const dpiSeedAmount = tenPow18.mul(toBN(10));

        await forceEth(contractAddresses.indexCoopFusePoolDpi);

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.indexCoopFusePoolDpi]
        });

        const indexCoopFusePoolDpiSigner = await ethers.getSigner(contractAddresses.indexCoopFusePoolDpi);

        await contracts.dpi.connect(indexCoopFusePoolDpiSigner).transfer(deployAddress, dpiSeedAmount.mul(toBN(2)));

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [contractAddresses.indexCoopFusePoolDpi]
        });

        // Seed bonding curve with dpi
        const bondingCurve = contracts.dpiBondingCurve;
        // increase mint cap
        await bondingCurve.setMintCap(tenPow18.mul(tenPow18));

        await contracts.dpi.approve(bondingCurve.address, dpiSeedAmount.mul(toBN(2)));
        await bondingCurve.purchase(deployAddress, dpiSeedAmount);
      });

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
        const expectedFinalBalance = feiBalanceBefore.add(expected);
        expect(feiBalanceAfter.eq(expectedFinalBalance)).to.be.true;
      });

      it('should transfer allocation from bonding curve to the uniswap deposit and Fuse', async function () {
        const bondingCurve = contracts.dpiBondingCurve;
        const uniswapPCVDeposit = contracts.dpiUniswapPCVDeposit;
        const fusePCVDeposit = contracts.indexCoopFusePoolDpiPCVDeposit;

        const pcvAllocations = await bondingCurve.getAllocation();
        expect(pcvAllocations[0].length).to.be.equal(2);

        const pcvDepositBefore = await uniswapPCVDeposit.balance();
        const fuseBalanceBefore = await fusePCVDeposit.balance();

        const allocatedDpi = await bondingCurve.balance();
        await bondingCurve.allocate();

        const curveBalanceAfter = await bondingCurve.balance();
        await expectApprox(curveBalanceAfter, toBN(0), '100');

        const pcvDepositAfter = await uniswapPCVDeposit.balance();
        await expectApprox(pcvDepositAfter.sub(pcvDepositBefore), allocatedDpi.mul(toBN(9)).div(toBN(10)), '10');

        const fuseBalanceAfter = await fusePCVDeposit.balance();
        await expectApprox(fuseBalanceAfter.sub(fuseBalanceBefore), allocatedDpi.div(toBN(10)), '100');
      });
    });

    describe('DAI', async function () {
      beforeEach(async function () {
        // Acquire DAI
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.compoundDai]
        });

        const daiSeedAmount = tenPow18.mul(toBN(1000000)); // 1M DAI

        await forceEth(contractAddresses.compoundDai);

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.compoundDai]
        });

        const compoundDaiSigner = await ethers.getSigner(contractAddresses.compoundDai);

        await contracts.dai.connect(compoundDaiSigner).transfer(deployAddress, daiSeedAmount);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [contractAddresses.compoundDai]
        });

        const bondingCurve = contracts.daiBondingCurve;
        // increase mint cap
        await bondingCurve.setMintCap(tenPow18.mul(tenPow18));
      });

      it('should allow purchase of Fei through bonding curve', async function () {
        const bondingCurve = contracts.daiBondingCurve;
        const fei = contracts.fei;
        const feiBalanceBefore = await fei.balanceOf(deployAddress);

        const daiAmount = tenPow18.mul(toBN(1000000)); // 1M DAI
        const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
        const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

        // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
        const expected = daiAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);

        await contracts.dai.approve(bondingCurve.address, daiAmount);
        await bondingCurve.purchase(deployAddress, daiAmount);

        const feiBalanceAfter = await fei.balanceOf(deployAddress);
        const expectedFinalBalance = feiBalanceBefore.add(expected);
        expectApprox(feiBalanceAfter, expectedFinalBalance);
      });

      it('should transfer allocation from bonding curve to the compound deposit', async function () {
        const bondingCurve = contracts.daiBondingCurve;
        const compoundPCVDeposit = contracts.compoundDaiPCVDeposit;

        const pcvAllocations = await bondingCurve.getAllocation();
        expect(pcvAllocations[0].length).to.be.equal(1);

        const pcvDepositBefore = await compoundPCVDeposit.balance();

        const allocatedDai = await bondingCurve.balance();
        await bondingCurve.allocate();

        const curveBalanceAfter = await bondingCurve.balance();
        await expectApprox(curveBalanceAfter, toBN(0), '100');

        const pcvDepositAfter = await compoundPCVDeposit.balance();
        await expectApprox(pcvDepositAfter.sub(pcvDepositBefore), allocatedDai, '100');
      });
    });

    describe('RAI', async function () {
      beforeEach(async function () {
        // Acquire RAI
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.reflexerStableAssetFusePoolRai]
        });

        const reflexerStableAssetFusePoolRaiSigner = await ethers.getSigner(
          contractAddresses.reflexerStableAssetFusePoolRai
        );

        const raiSeedAmount = tenPow18.mul(toBN(10000));

        await forceEth(contractAddresses.reflexerStableAssetFusePoolRai);
        await contracts.rai
          .connect(reflexerStableAssetFusePoolRaiSigner)
          .transfer(deployAddress, raiSeedAmount.mul(toBN(2)));

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [contractAddresses.reflexerStableAssetFusePoolRai]
        });

        // Seed bonding curve with rai
        const bondingCurve = contracts.raiBondingCurve;

        // increase mint cap
        await bondingCurve.setMintCap(tenPow18.mul(tenPow18));

        await contracts.rai.approve(bondingCurve.address, raiSeedAmount.mul(toBN(2)));
        await bondingCurve.purchase(deployAddress, raiSeedAmount);
      });

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
        const expectedFinalBalance = feiBalanceBefore.add(expected);
        expect(feiBalanceAfter.eq(expectedFinalBalance)).to.be.true;
      });

      it('should transfer allocation from bonding curve to Fuse', async function () {
        const bondingCurve = contracts.raiBondingCurve;
        const fusePCVDeposit = contracts.reflexerStableAssetFusePoolRaiPCVDeposit;
        const aaveRaiPCVDeposit = contracts.aaveRaiPCVDeposit;

        await fusePCVDeposit.deposit();
        const fuseBalanceBefore = await fusePCVDeposit.balance();

        const aaveBalanceBefore = await aaveRaiPCVDeposit.balance();

        const pcvAllocations = await bondingCurve.getAllocation();
        expect(pcvAllocations[0].length).to.be.equal(2);

        const allocatedRai = await bondingCurve.balance();
        await bondingCurve.allocate();

        // All RAI were allocated
        const curveBalanceAfter = await bondingCurve.balance();
        expect(curveBalanceAfter.eq(toBN(0))).to.be.true;

        const fuseBalanceAfter = await fusePCVDeposit.balance();
        const aaveBalanceAfter = await aaveRaiPCVDeposit.balance();

        // Half allocated to fuse, half to aave
        await expectApprox(fuseBalanceAfter.sub(fuseBalanceBefore), allocatedRai.div(toBN(2)), '100');
        await expectApprox(aaveBalanceAfter.sub(aaveBalanceBefore), allocatedRai.div(toBN(2)), '100');
      });
    });
  });

  // This test is skipped because the stableSwapOperator is not used in production
  describe.skip('StableSwapOperatorV1', async function () {
    it('should properly withdraw ~1M DAI to self', async function () {
      const daiBalanceBefore = await contracts.dai.balanceOf(contracts.curveMetapoolDeposit.address);
      //doLogging && console.log('daiBalanceBefore', daiBalanceBefore / 1e18);
      await contracts.curveMetapoolDeposit.withdraw(contracts.curveMetapoolDeposit.address, tenPow18.mul(toBN(1e6)));
      const daiBalanceAfter = await contracts.dai.balanceOf(contracts.curveMetapoolDeposit.address);
      //doLogging && console.log('daiBalanceAfter', daiBalanceAfter / 1e18);
      const daiBalanceWithdrawn = daiBalanceAfter.sub(daiBalanceBefore);
      //doLogging && console.log('daiBalanceWithdrawn', daiBalanceWithdrawn / 1e18);
      await expectApprox(daiBalanceWithdrawn, tenPow18.mul(toBN(1e6)), '1000');
    });
    it('should properly re-deposit ~1M DAI just withdrawn', async function () {
      const daiBalanceBefore = await contracts.dai.balanceOf(contracts.curveMetapoolDeposit.address);
      const balanceBefore = await contracts.curveMetapoolDeposit.balance();
      //doLogging && console.log('daiBalanceBefore', daiBalanceBefore / 1e18);
      //doLogging && console.log('balanceBefore', balanceBefore / 1e18);
      await expectApprox(daiBalanceBefore, tenPow18.mul(toBN(1e6)), '1000');
      await contracts.curveMetapoolDeposit.deposit();
      const daiBalanceAfter = await contracts.dai.balanceOf(contracts.curveMetapoolDeposit.address);
      expect(daiBalanceAfter.eq(toBN('0'))).to.be.true;
      //doLogging && console.log('daiBalanceAfter', daiBalanceAfter / 1e18);
      const balanceAfter = await contracts.curveMetapoolDeposit.balance();
      const balanceChange = balanceAfter.sub(balanceBefore);
      //doLogging && console.log('balanceChange', balanceChange / 1e18);
      //doLogging && console.log('balanceAfter', balanceAfter / 1e18);
      await expectApprox(balanceChange, tenPow18.mul(toBN(1e6)), '1000');
    });
  });

  it('should be able to redeem Fei from stabiliser', async function () {
    const fei = contracts.fei;
    const reserveStabilizer = contracts.ethReserveStabilizer;
    const signer = (await ethers.getSigners())[0];
    await signer.sendTransaction({ to: reserveStabilizer.address, value: tenPow18.mul(toBN(200)) });

    const contractEthBalanceBefore = toBN(await ethers.provider.getBalance(reserveStabilizer.address));
    const userFeiBalanceBefore = toBN(await fei.balanceOf(deployAddress));

    const feiTokensExchange = toBN(40000000000000);
    await reserveStabilizer.updateOracle();
    const expectedAmountOut = await reserveStabilizer.getAmountOut(feiTokensExchange);
    await reserveStabilizer.exchangeFei(feiTokensExchange);

    const contractEthBalanceAfter = toBN(await ethers.provider.getBalance(reserveStabilizer.address));
    const userFeiBalanceAfter = toBN(await fei.balanceOf(deployAddress));

    expect(contractEthBalanceBefore.sub(toBN(expectedAmountOut))).to.be.equal(contractEthBalanceAfter);
    expect(userFeiBalanceAfter).to.be.equal(userFeiBalanceBefore.sub(feiTokensExchange));
  });

  describe('Optimistic Approval', async () => {
    beforeEach(async function () {
      const { tribalChiefOptimisticMultisig, timelock } = contractAddresses;
      const { tribalChiefOptimisticTimelock } = contracts;

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [tribalChiefOptimisticMultisig]
      });

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [timelock]
      });

      const signer = (await ethers.getSigners())[0];

      await (
        await ethers.getSigner(timelock)
      ).sendTransaction({ to: tribalChiefOptimisticMultisig, value: toBN('40000000000000000') });
    });

    it('governor can assume timelock admin', async () => {
      const { timelock } = contractAddresses;
      const { optimisticTimelock } = contracts;

      await optimisticTimelock.connect(await ethers.getSigner(timelock)).becomeAdmin();

      const admin = await optimisticTimelock.TIMELOCK_ADMIN_ROLE();
      expect(await optimisticTimelock.hasRole(admin, timelock)).to.be.true;
    });

    it('proposal can execute on tribalChief', async () => {
      const { tribalChiefOptimisticMultisig } = contractAddresses;
      const { optimisticTimelock, tribalChief } = contracts;

      const oldBlockReward = await tribalChief.tribePerBlock();
      await optimisticTimelock
        .connect(await ethers.getSigner(tribalChiefOptimisticMultisig))
        .schedule(
          tribalChief.address,
          0,
          '0xf580ffcb0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '500000'
        );

      const hash = await optimisticTimelock.hashOperation(
        tribalChief.address,
        0,
        '0xf580ffcb0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000000000000000000000000001'
      );
      expect(await optimisticTimelock.isOperationPending(hash)).to.be.true;

      await time.increase('500000');
      await optimisticTimelock
        .connect(await ethers.getSigner(tribalChiefOptimisticMultisig))
        .execute(
          tribalChief.address,
          0,
          '0xf580ffcb0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000001'
        );

      expect(await tribalChief.tribePerBlock()).to.be.bignumber.equal('1');
      expect(await optimisticTimelock.isOperationDone(hash)).to.be.true;

      await tribalChief.updateBlockReward(oldBlockReward);
    });
  });

  describe('Drip Controller', async () => {
    it('drip controller can withdraw from PCV deposit to stabiliser', async function () {
      const ethReserveStabilizer = contracts.ethReserveStabilizer;
      const aaveEthPCVDeposit = contracts.aaveEthPCVDeposit;
      const pcvDripper = contracts.aaveEthPCVDripController;
      const fei = contracts.fei;

      const userFeiBalanceBefore = await fei.balanceOf(deployAddress);
      let stabilizerBalanceBefore = await ethReserveStabilizer.balance();

      const dripAmount = await pcvDripper.dripAmount();
      if (stabilizerBalanceBefore.gt(dripAmount)) {
        await ethReserveStabilizer.withdraw(deployAddress, stabilizerBalanceBefore);
        stabilizerBalanceBefore = await ethReserveStabilizer.balance();
      }

      const pcvDepositBefore = await aaveEthPCVDeposit.balance();
      // Trigger drip
      await time.increase((await pcvDripper.remainingTime()).toString());
      await pcvDripper.drip();

      // Check PCV deposit loses dripAmount ETH and stabilizer gets dripAmount ETH
      const pcvDepositAfter = toBN(await aaveEthPCVDeposit.balance());
      await expectApprox(pcvDepositAfter, pcvDepositBefore.sub(dripAmount), '100');

      const stabilizerBalanceAfter = toBN(await ethReserveStabilizer.balance());
      await expectApprox(stabilizerBalanceAfter, stabilizerBalanceBefore.add(dripAmount), '100');

      const feiIncentive = await pcvDripper.incentiveAmount();

      const userFeiBalanceAfter = await fei.balanceOf(deployAddress);
      expectApprox(userFeiBalanceAfter, userFeiBalanceBefore.add(feiIncentive));
    });
  });

  describe('Compound', async () => {
    it('should be able to deposit and withdraw ERC20 tokens', async function () {
      const erc20CompoundPCVDeposit = contracts.rariPool8FeiPCVDeposit;
      const fei = contracts.fei;
      const amount = '100000000000000000000000000';
      await fei.mint(erc20CompoundPCVDeposit.address, amount);

      const balanceBefore = await erc20CompoundPCVDeposit.balance();

      await erc20CompoundPCVDeposit.deposit();
      expectApprox((await erc20CompoundPCVDeposit.balance()).sub(balanceBefore), amount, '100');

      await erc20CompoundPCVDeposit.withdraw(deployAddress, amount);
      expect((await erc20CompoundPCVDeposit.balance()).sub(balanceBefore)).to.be.lt(amount);
    });

    it('should be able to deposit and withdraw ETH', async function () {
      const ethCompoundPCVDeposit = contracts.compoundEthPCVDeposit;
      const amount = tenPow18.mul(toBN(200));
      await ethCompoundPCVDeposit.deposit();

      const signer = (await ethers.getSigners())[0];
      await signer.sendTransaction({ to: ethCompoundPCVDeposit.address, value: amount });

      const balanceBefore = await ethCompoundPCVDeposit.balance();

      await ethCompoundPCVDeposit.deposit();
      expectApprox((await ethCompoundPCVDeposit.balance()).sub(balanceBefore), amount, '100');

      await ethCompoundPCVDeposit.withdraw(deployAddress, amount);
      expect((await ethCompoundPCVDeposit.balance()).sub(balanceBefore)).to.be.lt(amount);
    });
  });

  describe('Aave', async () => {
    it('should be able to deposit and withdraw ETH', async function () {
      const aaveEthPCVDeposit = contracts.aaveEthPCVDeposit;
      const amount = tenPow18.mul(toBN(200));

      try {
        await aaveEthPCVDeposit.deposit();
      } catch (e) {
        doLogging && console.log('Doing nothing.');
      }

      const signer = (await ethers.getSigners())[0];
      await signer.sendTransaction({ to: aaveEthPCVDeposit.address, value: amount });

      const balanceBefore = await aaveEthPCVDeposit.balance();

      await aaveEthPCVDeposit.deposit();
      expectApprox((await aaveEthPCVDeposit.balance()).sub(balanceBefore), amount, '100');

      await aaveEthPCVDeposit.withdraw(deployAddress, amount);

      expect((await aaveEthPCVDeposit.balance()).sub(balanceBefore)).to.be.lt(toBN(amount));
    });

    it('should be able to earn and claim stAAVE', async () => {
      const aaveEthPCVDeposit = contracts.aaveEthPCVDeposit;
      const amount = tenPow18.mul(toBN(200));
      const signer = (await ethers.getSigners())[0];
      await signer.sendTransaction({ to: aaveEthPCVDeposit.address, value: amount });

      const aaveBalanceBefore = await contracts.stAAVE.balanceOf(aaveEthPCVDeposit.address);
      await aaveEthPCVDeposit.deposit();

      await aaveEthPCVDeposit.claimRewards();
      const aaveBalanceAfter = await contracts.stAAVE.balanceOf(aaveEthPCVDeposit.address);

      expect(aaveBalanceAfter.sub(aaveBalanceBefore).gt(toBN(0)));
    });
  });

  describe('Access control', async () => {
    before(async () => {
      // Revoke deploy address permissions, so that does not erroneously
      // contribute to num governor roles etc
      await e2eCoord.revokeDeployAddressPermission();
    });

    it('should have granted correct role cardinality', async function () {
      const core = contracts.core;
      const accessRights = e2eCoord.getAccessControlMapping();

      const minterId = await core.MINTER_ROLE();
      const numMinterRoles = await core.getRoleMemberCount(minterId);
      expect(numMinterRoles.toNumber()).to.be.equal(accessRights.minter.length);

      const burnerId = await core.BURNER_ROLE();
      const numBurnerRoles = await core.getRoleMemberCount(burnerId);
      expect(numBurnerRoles.toNumber()).to.be.equal(accessRights.burner.length);

      const pcvControllerId = await core.PCV_CONTROLLER_ROLE();
      const numPCVControllerRoles = await core.getRoleMemberCount(pcvControllerId);
      expect(numPCVControllerRoles.toNumber()).to.be.equal(accessRights.pcvController.length);

      const governorId = await core.GOVERN_ROLE();
      const numGovernorRoles = await core.getRoleMemberCount(governorId);
      expect(numGovernorRoles.toNumber()).to.be.equal(accessRights.governor.length);

      const guardianId = await core.GUARDIAN_ROLE();
      const numGuaridanRoles = await core.getRoleMemberCount(guardianId);
      expect(numGuaridanRoles.toNumber()).to.be.equal(accessRights.guardian.length);
    });

    it('should have granted contracts correct roles', async function () {
      const core = contracts.core;
      const accessControl = e2eCoord.getAccessControlMapping();

      doLogging && console.log(`Testing minter role...`);
      for (let i = 0; i < accessControl.minter.length; i++) {
        const contractAddress = accessControl.minter[i];
        doLogging && console.log(`Minter contract address: ${contractAddress}`);
        const isMinter = await core.isMinter(contractAddress);
        expect(isMinter).to.be.true;
      }

      doLogging && console.log(`Testing burner role...`);
      for (let i = 0; i < accessControl.burner.length; i += 1) {
        const contractAddress = accessControl.burner[i];
        const isBurner = await core.isBurner(contractAddress);
        expect(isBurner).to.be.equal(true);
      }

      doLogging && console.log(`Testing pcv controller role...`);
      for (let i = 0; i < accessControl.pcvController.length; i += 1) {
        const contractAddress = accessControl.pcvController[i];
        const isPCVController = await core.isPCVController(contractAddress);
        expect(isPCVController).to.be.equal(true);
      }

      doLogging && console.log(`Testing guardian role...`);
      for (let i = 0; i < accessControl.guardian.length; i += 1) {
        const contractAddress = accessControl.guardian[i];
        const isGuardian = await core.isGuardian(contractAddress);
        expect(isGuardian).to.be.equal(true);
      }

      doLogging && console.log(`Testing governor role...`);
      for (let i = 0; i < accessControl.governor.length; i += 1) {
        const contractAddress = accessControl.governor[i];
        const isGovernor = await core.isGovernor(contractAddress);
        expect(isGovernor).to.be.equal(true);
      }

      doLogging && console.log(`Testing tribe minter address...`);
      const tribe = contracts.tribe;
      const tribeMinter = await tribe.minter();
      expect(tribeMinter).to.equal(contractAddresses.tribeReserveStabilizer);
    });
  });

  describe('TribalChief', async () => {
    async function testMultipleUsersPooling(
      tribalChief: Contract,
      lpToken: Contract,
      userAddresses: string | any[],
      incrementAmount: string | any[] | BigNumber,
      blocksToAdvance: number,
      lockLength: string | number | any[],
      totalStaked: string,
      pid: number
    ) {
      // if lock length isn't defined, it defaults to 0
      lockLength = lockLength === undefined ? 0 : lockLength;

      // approval loop
      for (let i = 0; i < userAddresses.length; i++) {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [userAddresses[i]]
        });

        const userSigner = await ethers.getSigner(userAddresses[i]);

        await lpToken.connect(userSigner).approve(tribalChief.address, uintMax);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [userAddresses[i]]
        });
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

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [userAddresses[i]]
        });

        const userSigner = await ethers.getSigner(userAddresses[i]);

        /*expectEvent(*/
        await tribalChief.connect(userSigner).deposit(pid, totalStaked, lockBlockAmount); /*,
          'Deposit', {
            user: userAddresses[i],
            pid: toBN(pid.toString()),
            amount: toBN(totalStaked),
            depositID: currentIndex,
          },
        );*/

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [userAddresses[i]]
        });
      }

      const pendingBalances = [];
      for (let i = 0; i < userAddresses.length; i++) {
        const balance = toBN(await tribalChief.pendingRewards(pid, userAddresses[i]));
        pendingBalances.push(balance);
      }

      for (let i = 0; i < blocksToAdvance; i++) {
        for (let j = 0; j < pendingBalances.length; j++) {
          pendingBalances[j] = toBN(await tribalChief.pendingRewards(pid, userAddresses[j]));
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
            toBN(await tribalChief.pendingRewards(pid, userAddresses[j])),
            pendingBalances[j].add(userIncrementAmount)
          );
        }
      }
    }

    async function unstakeAndHarvestAllPositions(
      userAddresses: string | any[],
      pid: number,
      tribalChief: Contract,
      stakedToken: Contract
    ) {
      for (let i = 0; i < userAddresses.length; i++) {
        const address = userAddresses[i];
        const startingStakedTokenBalance = await stakedToken.balanceOf(address);
        const { virtualAmount } = await tribalChief.userInfo(pid, address);
        const stakedTokens = await tribalChief.getTotalStakedInPool(pid, address);

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [address]
        });

        const userSigner = await ethers.getSigner(address);

        await tribalChief.connect(userSigner).withdrawAllAndHarvest(pid, address);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [address]
        });

        if (virtualAmount.toString() !== '0') {
          const afterStakedTokenBalance = await stakedToken.balanceOf(address);
          expect(afterStakedTokenBalance.eq(startingStakedTokenBalance.add(stakedTokens))).to.be.true;
        }
      }
    }

    describe('FeiTribe LP Token Staking', async () => {
      const feiTribeLPTokenOwner = '0x7D809969f6A04777F0A87FF94B57E56078E5fE0F';
      const feiTribeLPTokenOwnerNumberFour = '0xEc0AB4ED27f6dEF15165Fede40EebdcB955B710D';
      const feiTribeLPTokenOwnerNumberFive = '0x2464E8F7809c05FCd77C54292c69187Cb66FE294';
      const totalStaked = '100000000000000000000';

      let uniFeiTribe: Contract;
      let tribalChief: Contract;
      let tribePerBlock: BigNumber;
      let tribe: Contract;

      before(async function () {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [feiTribeLPTokenOwner]
        });

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [feiTribeLPTokenOwnerNumberFour]
        });

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [feiTribeLPTokenOwnerNumberFive]
        });

        // const { feiTribePairAddress }  = contractAddresses;
        uniFeiTribe = contracts.feiTribePair;
        tribalChief = contracts.tribalChief;
        tribePerBlock = await tribalChief.tribePerBlock();
        tribe = contracts.tribe;
        await forceEth(feiTribeLPTokenOwner);
      });

      it('find uni fei/tribe LP balances', async function () {
        expect(await uniFeiTribe.balanceOf(feiTribeLPTokenOwner)).to.be.gt(toBN(0));
        expect(await uniFeiTribe.balanceOf(feiTribeLPTokenOwnerNumberFour)).to.be.gt(toBN(0));
        expect(await uniFeiTribe.balanceOf(feiTribeLPTokenOwnerNumberFive)).to.be.gt(toBN(0));
      });

      it('stakes uniswap fei/tribe LP tokens', async function () {
        const pid = 0;

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [feiTribeLPTokenOwner]
        });

        const feiTribeLPTokenOwnerSigner = await ethers.getSigner(feiTribeLPTokenOwner);

        await uniFeiTribe.connect(feiTribeLPTokenOwnerSigner).approve(tribalChief.address, totalStaked);
        await tribalChief.connect(feiTribeLPTokenOwnerSigner).deposit(pid, totalStaked, 0);

        const advanceBlockAmount = 3;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        const balanceOfPool = await uniFeiTribe.balanceOf(tribalChief.address);
        const perBlockReward = tribePerBlock
          .div(await tribalChief.numPools())
          .mul(toBN(totalStaked))
          .div(balanceOfPool);

        expectApprox(
          await tribalChief.pendingRewards(pid, feiTribeLPTokenOwner),
          Number(perBlockReward.toString()) * advanceBlockAmount
        );

        await tribalChief.connect(feiTribeLPTokenOwnerSigner).harvest(pid, feiTribeLPTokenOwner);

        // add on one to the advance block amount as we have
        // advanced one more block when calling the harvest function
        expectApprox(
          await tribe.balanceOf(feiTribeLPTokenOwner),
          Number(perBlockReward.toString()) * (advanceBlockAmount + 1)
        );
        // now withdraw from deposit to clear the setup for the next test
        await unstakeAndHarvestAllPositions([feiTribeLPTokenOwner], pid, tribalChief, uniFeiTribe);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [feiTribeLPTokenOwner]
        });
      });

      it('multiple users stake uniswap fei/tribe LP tokens', async function () {
        const userAddresses = [feiTribeLPTokenOwner, feiTribeLPTokenOwnerNumberFour];
        const pid = 0;

        const balanceOfPool: BigNumber = await uniFeiTribe.balanceOf(tribalChief.address);
        const staked = ethers.BigNumber.from(totalStaked);
        const userPerBlockReward = tribePerBlock
          .div(await tribalChief.numPools())
          .mul(staked)
          .div(balanceOfPool.add(staked.mul(toBN(userAddresses.length))));

        await testMultipleUsersPooling(
          tribalChief,
          uniFeiTribe,
          userAddresses,
          userPerBlockReward,
          1,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const pendingTribe = await tribalChief.pendingRewards(pid, userAddresses[i]);

          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);
          const startingUniLPTokenBalance = await uniFeiTribe.balanceOf(userAddresses[i]);
          const startingTribeBalance = await tribe.balanceOf(userAddresses[i]);

          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [userAddresses[i]]
          });

          const userSigner = await ethers.getSigner(userAddresses[i]);

          await tribalChief.connect(userSigner).withdrawAllAndHarvest(pid, userAddresses[i]);

          await hre.network.provider.request({
            method: 'hardhat_stopImpersonatingAccount',
            params: [userAddresses[i]]
          });

          expect(await uniFeiTribe.balanceOf(userAddresses[i])).to.be.equal(
            toBN(totalStaked).add(startingUniLPTokenBalance)
          );

          expect(await tribe.balanceOf(userAddresses[i])).to.be.gt(pendingTribe.add(startingTribeBalance));
        }
        // withdraw from deposit to clear the setup for the next test
        await unstakeAndHarvestAllPositions(userAddresses, pid, tribalChief, uniFeiTribe);
      });

      it('multiple users stake uniswap fei/tribe LP tokens, one user calls emergency withdraw and loses all reward debt', async function () {
        const userAddresses = [feiTribeLPTokenOwner, feiTribeLPTokenOwnerNumberFour, feiTribeLPTokenOwnerNumberFive];
        const pid = 0;

        const balanceOfPool = await uniFeiTribe.balanceOf(tribalChief.address);
        const staked = toBN(totalStaked);
        const userPerBlockReward = tribePerBlock
          .div(await tribalChief.numPools())
          .mul(staked)
          .div(balanceOfPool.add(staked.mul(toBN(userAddresses.length))));

        await testMultipleUsersPooling(
          tribalChief,
          uniFeiTribe,
          userAddresses,
          userPerBlockReward,
          1,
          0,
          totalStaked,
          pid
        );

        const startingUniLPTokenBalance = await uniFeiTribe.balanceOf(feiTribeLPTokenOwnerNumberFive);
        const { virtualAmount } = await tribalChief.userInfo(pid, feiTribeLPTokenOwnerNumberFive);

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [feiTribeLPTokenOwnerNumberFive]
        });

        const feiTribeLPTokenOwnerNumberFiveSigner = await ethers.getSigner(feiTribeLPTokenOwnerNumberFive);

        await tribalChief
          .connect(feiTribeLPTokenOwnerNumberFiveSigner)
          .emergencyWithdraw(pid, feiTribeLPTokenOwnerNumberFive);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [feiTribeLPTokenOwnerNumberFive]
        });

        const endingUniLPTokenBalance = await uniFeiTribe.balanceOf(feiTribeLPTokenOwnerNumberFive);
        expect(startingUniLPTokenBalance.add(virtualAmount)).to.be.equal(endingUniLPTokenBalance);
        const { rewardDebt } = await tribalChief.userInfo(pid, feiTribeLPTokenOwnerNumberFive);
        expect(rewardDebt).to.be.equal(toBN(0));

        // remove user 5 from userAddresses array
        userAddresses.pop();
        for (let i = 0; i < userAddresses.length; i++) {
          const pendingTribe = await tribalChief.pendingRewards(pid, userAddresses[i]);

          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);
          const startingUniLPTokenBalance = await uniFeiTribe.balanceOf(userAddresses[i]);
          const startingTribeBalance = await tribe.balanceOf(userAddresses[i]);

          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [userAddresses[i]]
          });

          const userSigner = await ethers.getSigner(userAddresses[i]);

          await tribalChief.connect(userSigner).withdrawAllAndHarvest(pid, userAddresses[i]);

          await hre.network.provider.request({
            method: 'hardhat_stopImpersonatingAccount',
            params: [userAddresses[i]]
          });

          expect(await uniFeiTribe.balanceOf(userAddresses[i])).to.be.equal(
            toBN(totalStaked).add(startingUniLPTokenBalance)
          );

          expect(await tribe.balanceOf(userAddresses[i])).to.be.gt(pendingTribe.add(startingTribeBalance));
        }
        // withdraw from deposit to clear the setup for the next test
        await unstakeAndHarvestAllPositions(userAddresses, pid, tribalChief, uniFeiTribe);
      });
    });
  });

  describe('ERC20Dripper', async () => {
    let tribalChief: Contract;
    let tribePerBlock: any;
    let tribe: Contract;
    let dripper: Contract;
    let timelockAddress: string;
    let minter: string;

    before(async function () {
      dripper = contracts.erc20Dripper;
      tribalChief = contracts.tribalChief;
      tribePerBlock = await tribalChief.tribePerBlock();
      tribe = contracts.tribe;
      timelockAddress = contractAddresses.timelock;
    });

    beforeEach(async function () {
      minter = await tribe.minter();
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [minter]
      });

      const minterSigner = await ethers.getSigner(minter);

      await forceEth(minter);

      await tribe.connect(minterSigner).mint(dripper.address, dripAmount.mul(toBN(11)));

      await hre.network.provider.request({
        method: 'hardhat_stopImpersonatingAccount',
        params: [minter]
      });
    });

    it('should be able to withdraw as PCV controller', async function () {
      const totalLockedTribe = await dripper.balance();
      const dripperStartingBalance = await tribe.balanceOf(dripper.address);

      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [timelockAddress]
      });

      const timelockSigner = await ethers.getSigner(timelockAddress);

      await dripper.connect(timelockSigner).withdraw(tribalChief.address, totalLockedTribe);

      await hre.network.provider.request({
        method: 'hardhat_stopImpersonatingAccount',
        params: [timelockAddress]
      });

      const dripperEndingBalance = await tribe.balanceOf(dripper.address);

      expect(dripperEndingBalance.eq(toBN(0))).to.be.true;
      expect(dripperStartingBalance.eq(totalLockedTribe)).to.be.true;
    });

    it('should be able to call drip when enough time has passed through multiple periods', async function () {
      for (let i = 0; i < 11; i++) {
        await time.increase(dripFrequency.toString());

        expect(await dripper.isTimeEnded()).to.be.true;

        const tribalChiefStartingBalance = await tribe.balanceOf(tribalChief.address);
        await dripper.drip();
        const tribalChiefEndingBalance = await tribe.balanceOf(tribalChief.address);

        expect(await dripper.isTimeEnded()).to.be.false;
        expect(tribalChiefStartingBalance.add(dripAmount).eq(tribalChiefEndingBalance)).to.be.true;
      }
    });
  });
});
