import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { expectApprox } from '@test/helpers';
import proposals from '@test/integration/proposals_config.json';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import {
  CollateralizationOracle,
  StaticPCVDepositWrapper,
  CollateralizationOracleWrapper,
  CollateralizationOracleGuardian
} from '@custom-types/contracts';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
});

describe('e2e-collateralization', function () {
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

  describe('Collateralization Oracle Guardian', async function () {
    it('can update cache', async function () {
      const collateralizationOracleWrapper: CollateralizationOracleWrapper =
        contracts.collateralizationOracleWrapper as CollateralizationOracleWrapper;

      const collateralizationOracleGuardian: CollateralizationOracleGuardian =
        contracts.collateralizationOracleGuardian as CollateralizationOracleGuardian;

      await collateralizationOracleWrapper.update();

      const wrapperStats = await collateralizationOracleWrapper.pcvStats();

      // Set cache values 1% higher
      await collateralizationOracleGuardian.setCache(
        wrapperStats[0].mul(101).div(100),
        wrapperStats[1].mul(101).div(100)
      );

      // Check cache updates
      const wrapperStatsAfter = await collateralizationOracleWrapper.pcvStats();
      expect(wrapperStatsAfter[0]).to.be.bignumber.equal(wrapperStats[0].mul(101).div(100));
      expect(wrapperStatsAfter[1]).to.be.bignumber.equal(wrapperStats[1].mul(101).div(100));
    });
  });

  describe('Collateralization Oracle Wrapper', async function () {
    it('collateralization changes register after an update', async function () {
      const collateralizationOracleWrapper: CollateralizationOracleWrapper =
        contracts.collateralizationOracleWrapper as CollateralizationOracleWrapper;
      const collateralizationOracle: CollateralizationOracle =
        contracts.collateralizationOracle as CollateralizationOracle;
      const staticPcvDepositWrapper: StaticPCVDepositWrapper =
        contracts.staticPcvDepositWrapper as StaticPCVDepositWrapper;

      await collateralizationOracleWrapper.update();

      const beforeBalance = await staticPcvDepositWrapper.balance();

      // Make sure wrapper = oracle after update
      const beforeStats = await collateralizationOracle.pcvStats();
      const wrapperStats = await collateralizationOracleWrapper.pcvStats();

      expect(wrapperStats[0]).to.be.bignumber.equal(beforeStats[0]);
      expect(wrapperStats[1]).to.be.bignumber.equal(beforeStats[1]);
      expect(wrapperStats[2]).to.be.bignumber.equal(beforeStats[2]);

      // Zero out the static balance
      await staticPcvDepositWrapper.setBalance(0);

      // Make sure wrapper unchanged
      const wrapperStatsAfter = await collateralizationOracleWrapper.pcvStats();
      expect(wrapperStatsAfter[0]).to.be.bignumber.equal(beforeStats[0]);
      expect(wrapperStatsAfter[1]).to.be.bignumber.equal(beforeStats[1]);
      expect(wrapperStatsAfter[2]).to.be.bignumber.equal(beforeStats[2]);

      // Make sure wrapper current matches the true value
      const wrapperStatsAfterCurrent = await collateralizationOracleWrapper.pcvStatsCurrent();
      expectApprox(wrapperStatsAfterCurrent[0], beforeStats[0].sub(beforeBalance));
      expectApprox(wrapperStatsAfterCurrent[1], beforeStats[1]);
      expectApprox(wrapperStatsAfterCurrent[2], beforeStats[2].sub(beforeBalance));

      // Make sure wrapper matches the true value after another update
      await collateralizationOracleWrapper.update();

      const afterStats = await collateralizationOracle.pcvStats();

      const wrapperStatsAfterUpdate = await collateralizationOracleWrapper.pcvStats();
      expectApprox(wrapperStatsAfterUpdate[0], afterStats[0]);
      expectApprox(wrapperStatsAfterUpdate[1], afterStats[1]);
      expectApprox(wrapperStatsAfterUpdate[2], afterStats[2]);
    });
  });
});
