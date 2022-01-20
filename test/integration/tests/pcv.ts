import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { Contract } from 'ethers';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { expectApprox, getImpersonatedSigner, overwriteChainlinkAggregator, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { forceEth } from '@test/integration/setup/utils';

const toBN = ethers.BigNumber.from;

// We will drip 4 million tribe per week
const dripAmount = toBN(4000000).mul(toBN(10).pow(toBN(18)));
// number of seconds between allowed drips
// this is 1 week in seconds
const dripFrequency = 604800;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-pcv', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  const tenPow18 = ethers.constants.WeiPerEther;

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

  describe('BAMM', function () {
    it('should be able to withdraw LUSD from B.AMM', async function () {
      // set Chainlink ETHUSD to a fixed 4,000$ value
      await overwriteChainlinkAggregator(contractAddresses.chainlinkEthUsdOracle, '400000000000', '8');

      const stabilityPool = '0x66017D22b0f8556afDd19FC67041899Eb65a21bb';
      const signer = await getImpersonatedSigner(stabilityPool);
      await contracts.lusd.connect(signer).transfer(contracts.bammDeposit.address, ethers.constants.WeiPerEther);

      await contracts.bammDeposit.deposit();
      expect(await contracts.bammDeposit.balance()).to.be.at.least(toBN(89_000_000).mul(tenPow18));

      await contracts.bammDeposit.withdraw(contractAddresses.feiDAOTimelock, toBN(89_000_000).mul(tenPow18));

      const lusdBalanceAfter = await contracts.lusd.balanceOf(contracts.feiDAOTimelock.address);
      expect(lusdBalanceAfter).to.be.bignumber.equal(toBN(89_000_000).mul(tenPow18));
    });
  });

  describe('PCV Guardian', async () => {
    it('can withdraw PCV and pause', async () => {
      const pcvGuardian = contracts.pcvGuardian;

      const amount = await contracts.compoundEthPCVDeposit.balance();
      await pcvGuardian.withdrawToSafeAddress(
        contractAddresses.compoundEthPCVDeposit,
        contractAddresses.aaveEthPCVDeposit,
        amount,
        false,
        true
      );

      expect(await ethers.provider.getBalance(contractAddresses.aaveEthPCVDeposit)).to.be.bignumber.equal(toBN(0));
    });

    it('can withdraw PCV and pause', async () => {
      const pcvGuardian = contracts.pcvGuardian;

      const feiBalanceBefore = await contracts.fei.balanceOf(contractAddresses.feiDAOTimelock);
      await pcvGuardian.withdrawToSafeAddress(
        contractAddresses.rariPool8FeiPCVDeposit,
        contractAddresses.feiDAOTimelock,
        ethers.constants.WeiPerEther,
        true,
        false
      );

      const feiBalanceAfter = await contracts.fei.balanceOf(contractAddresses.feiDAOTimelock);

      expect(await contracts.rariPool8FeiPCVDeposit.paused()).to.be.true;
      expect(feiBalanceAfter.sub(feiBalanceBefore)).to.be.bignumber.equal(ethers.constants.WeiPerEther);
      await contracts.rariPool8FeiPCVDeposit.unpause();
    });
  });

  /// pause this test as it has been disabled for FIP-62
  /// PCVDripController now sends funds to the eth PSM
  describe.skip('Drip Controller', async () => {
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

  describe('ERC20Dripper', async () => {
    let tribalChief: Contract;
    let tribe: Contract;
    let dripper: Contract;
    let timelockAddress: string;
    let minter: string;

    before(async function () {
      dripper = contracts.erc20Dripper;
      tribalChief = contracts.tribalChief;
      tribe = contracts.tribe;
      timelockAddress = contractAddresses.feiDAOTimelock;
      await forceEth(timelockAddress);
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
    });

    after(async function () {
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
