import { CollateralizationOracle } from '@custom-types/contracts';
import { NamedContracts } from '@custom-types/types';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { expectApprox, getImpersonatedSigner } from '@test/helpers';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';

describe('e2e-CR', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

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
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    // unpause the pcv equity minter if it is paused
    if (await contracts.pcvEquityMinter.paused()) {
      const govSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
      await contracts.pcvEquityMinter.connect(govSigner).unpause();
    }
  });

  describe('Collateralization Oracle', async function () {
    before(async function () {
      const numDeposits = await contracts.namedStaticPCVDepositWrapper.numDeposits();
      if (numDeposits == 0) {
        await contracts.namedStaticPCVDepositWrapper.addDeposit({
          depositName: 'make static pcv deposit not empty',
          usdAmount: 1,
          feiAmount: 1,
          underlyingTokenAmount: 1,
          underlyingToken: ethers.constants.AddressZero
        });
      }
    });

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
});
