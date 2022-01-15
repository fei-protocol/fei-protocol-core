import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import {
  expectApprox,
  getImpersonatedSigner,
  increaseTime,
  latestTime,
  resetFork,
  overwriteChainlinkAggregator
} from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { BalancerLBPSwapper, CollateralizationOracle, IVault, IWeightedPool } from '@custom-types/contracts';
import { forceEth } from '../setup/utils';
const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-buybacks', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
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
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('PCV Equity Minter + LBP', async function () {
    it('mints appropriate amount and swaps', async function () {
      const {
        pcvEquityMinter,
        collateralizationOracleWrapper,
        namedStaticPCVDepositWrapper,
        noFeeFeiTribeLBPSwapper,
        fei,
        tribe,
        core
      } = contracts;

      await increaseTime(await noFeeFeiTribeLBPSwapper.remainingTime());

      const pcvStats = await collateralizationOracleWrapper.pcvStats();

      if (pcvStats[2] < 0) {
        await namedStaticPCVDepositWrapper.addDeposit({
          depositName: 'deposit',
          usdAmount: pcvStats[0],
          feiAmount: '0',
          underlyingTokenAmount: 1,
          underlyingToken: tribe.address
        });
      }

      // set Chainlink ETHUSD to a fixed 4,000$ value
      await overwriteChainlinkAggregator(contractAddresses.chainlinkEthUsdOracle, '400000000000', '8');

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

  describe('Collateralization Oracle', async function () {
    it('exempting an address removes from PCV stats', async function () {
      const collateralizationOracle: CollateralizationOracle =
        contracts.collateralizationOracle as CollateralizationOracle;
      const namedStaticPCVDepositWrapper = contracts.namedStaticPCVDepositWrapper;

      const beforeBalance = (await namedStaticPCVDepositWrapper.pcvDeposits(0)).usdAmount;

      const beforeStats = await collateralizationOracle.pcvStats();
      await namedStaticPCVDepositWrapper.removeDeposit(0);
      const afterStats = await collateralizationOracle.pcvStats();

      expectApprox(afterStats[0], beforeStats[0].sub(beforeBalance));
      expectApprox(afterStats[1], afterStats[1]);
      expectApprox(afterStats[2], beforeStats[2].sub(beforeBalance));
    });
  });

  describe('Collateralization Oracle Keeper', async function () {
    it('can only call when deviation or time met', async function () {
      const { namedStaticPCVDepositWrapper, collateralizationOracleWrapper, collateralizationOracleKeeper, fei } =
        contracts;

      const beforeBalance = await fei.balanceOf(deployAddress);

      // set Chainlink ETHUSD to a fixed 4,000$ value
      await overwriteChainlinkAggregator(contractAddresses.chainlinkEthUsdOracle, '400000000000', '8');

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
      await namedStaticPCVDepositWrapper.addDeposit({
        depositName: 'massive test deposit',
        usdAmount: pcvStats[0],
        feiAmount: 1,
        underlyingTokenAmount: 1,
        underlyingToken: ethers.constants.AddressZero
      });

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
