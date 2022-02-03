import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { TRIBERagequit, PegExchanger, PegExchangerDripper } from '@custom-types/contracts';
import { expectApprox, expectRevert } from '@test/helpers';
import { createTree } from '@scripts/utils/merkle';
import { solidityKeccak256 } from 'ethers/lib/utils';
import { forceEth } from '../setup/utils';

const toBN = ethers.BigNumber.from;

describe('e2e-merger', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
    await resetFork();
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

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe.skip('PegExchanger', async () => {
    const RGT_WHALE = '0x20017a30D3156D4005bDA08C40Acda0A6aE209B1';

    it('drips correctly before expiration', async function () {
      const pegExchanger: PegExchanger = contracts.pegExchanger as PegExchanger;
      const pegExchangerDripper: PegExchangerDripper = contracts.pegExchangerDripper as PegExchangerDripper;

      const { tribe } = contracts;

      const signer = await getImpersonatedSigner(pegExchanger.address);
      await forceEth(pegExchanger.address);

      await tribe.connect(signer).transfer(RGT_WHALE, await tribe.balanceOf(pegExchanger.address));

      // check drip eligibility and drip
      expect(await pegExchangerDripper.isEligible()).to.be.true;

      await pegExchangerDripper.drip();

      // ensure tribe dripped
      const tribeBalance = await tribe.balanceOf(await pegExchangerDripper.PEG_EXCHANGER());
      expect(tribeBalance).to.be.bignumber.equal(await pegExchangerDripper.DRIP_AMOUNT());

      // ensure ineligible with over threshold revert
      expect(await pegExchangerDripper.isEligible()).to.be.false;

      await expectRevert(pegExchangerDripper.drip(), 'over threshold');
    });

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

    it('recovers tokens after expiry', async function () {
      const pegExchanger: PegExchanger = contracts.pegExchanger as PegExchanger;
      const pegExchangerDripper: PegExchangerDripper = contracts.pegExchangerDripper as PegExchangerDripper;
      const { tribe } = contracts;

      const signer = await getImpersonatedSigner(contractAddresses.feiDAOTimelock);
      await forceEth(contractAddresses.feiDAOTimelock);

      await pegExchanger.connect(signer).setExpirationTimestamp('1000000000000');

      await time.increaseTo('1000000000000');

      // ensure ineligible with expired revert
      expect(await pegExchangerDripper.isEligible()).to.be.false;

      await expectRevert(pegExchangerDripper.drip(), 'expired');

      await pegExchangerDripper.recover();

      const tribeBalance = await tribe.balanceOf(pegExchangerDripper.address);
      expect(tribeBalance).to.be.bignumber.equal(toBN('0'));
    });
  });
});
