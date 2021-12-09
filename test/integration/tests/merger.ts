import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { PegExchanger } from '@custom-types/contracts';
import { expectApprox } from '@test/helpers';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-merger', function () {
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

  describe('TribeRagequit', async function () {
    it.skip('ngmi', async function () {
      // TODO
    });
  });

  describe('PegExchanger', async () => {
    const RGT_WHALE = '0x20017a30D3156D4005bDA08C40Acda0A6aE209B1';

    it('exchanges RGT for TRIBE', async function () {
      const pegExchanger: PegExchanger = contracts.pegExchanger as PegExchanger;
      const { rgt, tribe } = contracts;

      const signer = await getImpersonatedSigner(RGT_WHALE);

      const rgtBalanceBefore = await rgt.balanceOf(RGT_WHALE);
      const tribeBalanceBefore = await tribe.balanceOf(RGT_WHALE);
      await rgt.connect(signer).approve(pegExchanger.address, ethers.constants.MaxUint256);

      await pegExchanger.connect(signer).exchange(ethers.constants.WeiPerEther);
      const rgtBalanceAfter = await rgt.balanceOf(RGT_WHALE);
      const tribeBalanceAfter = await tribe.balanceOf(RGT_WHALE);

      expect(rgtBalanceBefore.sub(rgtBalanceAfter)).to.be.bignumber.equal(ethers.constants.WeiPerEther);
      expectApprox(tribeBalanceAfter.sub(tribeBalanceBefore), ethers.constants.WeiPerEther.mul(27));
    });
  });
});
