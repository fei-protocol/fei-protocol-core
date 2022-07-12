import { NamedStaticPCVDepositWrapper } from '@custom-types/contracts';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { CollateralizationOracleConfig } from '@protocol/collateralizationOracle';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';

describe('e2e-collateralization', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  const allNames = [];
  const eth = ethers.constants.WeiPerEther;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
  });

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

    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    const namedStaticPCVDepositWrapper: NamedStaticPCVDepositWrapper =
      contracts.namedStaticPCVDepositWrapper as NamedStaticPCVDepositWrapper;
    const numDeposits = Number(await namedStaticPCVDepositWrapper.numDeposits());
    for (let i = 0; i < numDeposits; i++) {
      const deposit = await namedStaticPCVDepositWrapper.pcvDeposits(i);
      allNames.push(deposit.depositName);
    }
  });

  describe('Named PCVDeposit Wrapper', async function () {
    it('can fetch all underlying token addresses', async function () {
      const namedStaticPCVDepositWrapper: NamedStaticPCVDepositWrapper =
        contracts.namedStaticPCVDepositWrapper as NamedStaticPCVDepositWrapper;

      const allTokenAddresses = await namedStaticPCVDepositWrapper.getAllUnderlying();
      expect(allTokenAddresses.length).to.be.eq(allNames.length);

      for (let i = 0; i < allTokenAddresses.length; i++) {
        const deposit = await namedStaticPCVDepositWrapper.pcvDeposits(i);
        expect(allTokenAddresses[i]).to.equal(deposit.underlyingToken);
      }
    });

    it('number of deposits is correct', async function () {
      const namedStaticPCVDepositWrapper: NamedStaticPCVDepositWrapper =
        contracts.namedStaticPCVDepositWrapper as NamedStaticPCVDepositWrapper;
      const numDeposits = Number(await namedStaticPCVDepositWrapper.numDeposits());
      expect(numDeposits).to.be.eq(allNames.length);
    });

    it('can add a new deposit', async function () {
      const namedStaticPCVDepositWrapper: NamedStaticPCVDepositWrapper =
        contracts.namedStaticPCVDepositWrapper as NamedStaticPCVDepositWrapper;
      const startingFeiUSDValues = await namedStaticPCVDepositWrapper.resistantBalanceAndFei();
      const feiAmount = eth.mul(10_000);

      await namedStaticPCVDepositWrapper.addDeposit({
        depositName: 'intangible brand value',
        underlyingToken: namedStaticPCVDepositWrapper.address,
        underlyingTokenAmount: 10_000_000,
        feiAmount,
        usdAmount: 0
      });

      const endingFeiUSDValues = await namedStaticPCVDepositWrapper.resistantBalanceAndFei();
      const numDeposits = await namedStaticPCVDepositWrapper.numDeposits();

      expect(numDeposits).to.be.eq(allNames.length + 1);
      expect(startingFeiUSDValues[0]).to.be.eq(endingFeiUSDValues[0]);
      expect(startingFeiUSDValues[1].add(feiAmount)).to.be.eq(endingFeiUSDValues[1]);
    });

    it('can remove an existing deposit', async function () {
      const namedStaticPCVDepositWrapper: NamedStaticPCVDepositWrapper =
        contracts.namedStaticPCVDepositWrapper as NamedStaticPCVDepositWrapper;
      await namedStaticPCVDepositWrapper.removeDeposit(Number(await namedStaticPCVDepositWrapper.numDeposits()) - 1);
      const numDeposits = Number(await namedStaticPCVDepositWrapper.numDeposits());
      expect(numDeposits).to.be.eq(allNames.length);
    });
  });

  describe('Collateralization Oracle', function () {
    it('token deposits should match', async function () {
      const collateralizationOracle = contracts.collateralizationOracle;

      for (const entry of Object.entries(CollateralizationOracleConfig)) {
        const expectedEntryCount = entry[1].length;
        const tokenAddress = contractAddresses[entry[0]];
        const entryAddresses = entry[1].map((name) => contractAddresses[name]);
        const deposits = await collateralizationOracle.getDepositsForToken(tokenAddress);
        const actualEntryCount = deposits.length;

        expect(actualEntryCount).to.be.equal(
          expectedEntryCount,
          `Expected ${expectedEntryCount} entries for token ${entry[0]}, got ${actualEntryCount}`
        );

        for (const deposit of deposits) {
          expect(entryAddresses).to.include(deposit);
        }
      }
    });
  });
});
