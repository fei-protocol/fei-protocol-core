import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { expectApprox, getImpersonatedSigner, increaseTime, latestTime, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import {
  BalancerLBPSwapper,
  CollateralizationOracle,
  IVault,
  IWeightedPool,
  StaticPCVDepositWrapper
} from '@custom-types/contracts';
import { forceEth } from '../setup/utils';
const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-buybacks', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

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
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('PCV Equity Minter + LBP', async function () {
    it('mints appropriate amount and swaps', async function () {
      const {
        pcvEquityMinter,
        collateralizationOracleWrapper,
        staticPcvDepositWrapper,
        noFeeFeiTribeLBPSwapper,
        fei,
        tribe,
        core
      } = contracts;

      await increaseTime(await noFeeFeiTribeLBPSwapper.remainingTime());

      const pcvStats = await collateralizationOracleWrapper.pcvStats();

      if (pcvStats[2] < 0) {
        await staticPcvDepositWrapper.setBalance(pcvStats[0]);
      }
      await collateralizationOracleWrapper.update();

      await core.allocateTribe(noFeeFeiTribeLBPSwapper.address, ethers.constants.WeiPerEther.mul(1_000_000));
      const tx = await pcvEquityMinter.mint();
      expect(tx).to.emit(pcvEquityMinter, 'FeiMinting');
      expect(tx).to.emit(fei, 'Transfer');
      expect(tx).to.emit(tribe, 'Transfer');

      expect(await noFeeFeiTribeLBPSwapper.swapEndTime()).to.be.gt(toBN((await latestTime()).toString()));

      await increaseTime(await pcvEquityMinter.duration());
      await core.allocateTribe(noFeeFeiTribeLBPSwapper.address, ethers.constants.WeiPerEther.mul(1_000_000));

      await pcvEquityMinter.mint();
    });
  });

  // Skipped because the LUSD auction is now over
  describe.skip('LUSD LBP', async function () {
    it('mints appropriate amount and swaps', async function () {
      const feiLusdLBPSwapper: BalancerLBPSwapper = contracts.feiLusdLBPSwapper as BalancerLBPSwapper;
      const feiLusdLBP: IWeightedPool = contracts.feiLusdLBP as IWeightedPool;
      const balancerVault: IVault = contracts.balancerVault as IVault;

      const LUSD_HOLDING_ADDRESS = '0x66017D22b0f8556afDd19FC67041899Eb65a21bb';
      await forceEth(LUSD_HOLDING_ADDRESS);
      const lusdSigner = await getImpersonatedSigner(LUSD_HOLDING_ADDRESS);

      await contracts.lusd.connect(lusdSigner).approve(balancerVault.address, ethers.constants.MaxUint256);

      await balancerVault.connect(lusdSigner).swap(
        {
          poolId: await feiLusdLBP.getPoolId(),
          kind: 0, // given in
          assetIn: contracts.lusd.address,
          assetOut: contracts.fei.address,
          amount: ethers.constants.WeiPerEther.mul(300_000),
          userData: '0x'
        },
        {
          sender: LUSD_HOLDING_ADDRESS,
          fromInternalBalance: false,
          recipient: LUSD_HOLDING_ADDRESS,
          toInternalBalance: false
        },
        ethers.constants.WeiPerEther.mul(200_000),
        ethers.constants.WeiPerEther // huge deadline
      );
      await increaseTime(24 * 3600);

      // get pool info
      const poolId = await feiLusdLBP.getPoolId();
      const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
      // there should be 1.01M LUSD in the pool
      expect(poolTokens.tokens[0]).to.be.equal(contracts.lusd.address);
      expect(poolTokens.balances[0]).to.be.equal('1310101010101010101010101');

      await balancerVault.connect(lusdSigner).swap(
        {
          poolId: poolId,
          kind: 0, // given in
          assetIn: contracts.lusd.address,
          assetOut: contracts.fei.address,
          amount: ethers.constants.WeiPerEther.mul(300_000),
          userData: '0x'
        },
        {
          sender: LUSD_HOLDING_ADDRESS,
          fromInternalBalance: false,
          recipient: LUSD_HOLDING_ADDRESS,
          toInternalBalance: false
        },
        ethers.constants.WeiPerEther.mul(1_000_000),
        ethers.constants.WeiPerEther // huge deadline
      );

      await increaseTime(await feiLusdLBPSwapper.remainingTime());

      await feiLusdLBPSwapper.swap();
      expect(
        await contracts.lusd.balanceOf(contracts.liquityFusePoolLusdPCVDeposit.address)
      ).to.be.bignumber.greaterThan(ethers.constants.WeiPerEther.mul(600_000));
    });
  });

  describe('Collateralization Oracle', async function () {
    it('exempting an address removes from PCV stats', async function () {
      const collateralizationOracle: CollateralizationOracle =
        contracts.collateralizationOracle as CollateralizationOracle;
      const staticPcvDepositWrapper: StaticPCVDepositWrapper =
        contracts.staticPcvDepositWrapper as StaticPCVDepositWrapper;

      const beforeBalance = await staticPcvDepositWrapper.balance();

      const beforeStats = await collateralizationOracle.pcvStats();
      await staticPcvDepositWrapper.setBalance(0);
      const afterStats = await collateralizationOracle.pcvStats();

      expectApprox(afterStats[0], beforeStats[0].sub(beforeBalance));
      expectApprox(afterStats[1], afterStats[1]);
      expectApprox(afterStats[2], beforeStats[2].sub(beforeBalance));
    });
  });

  describe('Collateralization Oracle Keeper', async function () {
    it('can only call when deviation or time met', async function () {
      const { staticPcvDepositWrapper2, collateralizationOracleWrapper, collateralizationOracleKeeper, fei } =
        contracts;

      const beforeBalance = await fei.balanceOf(deployAddress);

      await collateralizationOracleWrapper.update();

      // After updating everything should be up to date
      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.false;

      // After time increase, should be outdated
      await increaseTime(await collateralizationOracleWrapper.remainingTime());

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.true;
      expect(await collateralizationOracleWrapper.isOutdated()).to.be.true;
      expect(await collateralizationOracleWrapper.isExceededDeviationThreshold()).to.be.false;

      // UpdateIfOutdated succeeds
      await collateralizationOracleWrapper.updateIfOutdated();

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.false;

      // Increase PCV balance to exceed deviation threshold
      const pcvStats = await collateralizationOracleWrapper.pcvStats();
      await staticPcvDepositWrapper2.setBalance(pcvStats[0]);

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.true;
      expect(await collateralizationOracleWrapper.isOutdated()).to.be.false;
      expect(await collateralizationOracleWrapper.isExceededDeviationThreshold()).to.be.true;

      // Keeper is incentivized to update oracle
      await increaseTime(await collateralizationOracleKeeper.MIN_MINT_FREQUENCY());

      await collateralizationOracleKeeper.mint();

      const incentive = await collateralizationOracleKeeper.incentiveAmount();
      expect(beforeBalance.add(incentive)).to.be.equal(await fei.balanceOf(deployAddress));

      expect(await collateralizationOracleWrapper.isOutdatedOrExceededDeviationThreshold()).to.be.false;
    });
  });
});
