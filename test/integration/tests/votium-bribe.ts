import { expect } from 'chai';
import { ethers } from 'hardhat';
import { NamedContracts, NamedAddresses } from '@custom-types/types';
import { getImpersonatedSigner, time, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { expectRevert } from '@test/helpers';
import { forceEth } from '../setup/utils';

const VOTIUM_ADMIN = '0xdC7C7F0bEA8444c12ec98Ec626ff071c6fA27a19'; // tommyg.eth
const CVX_PROPOSAL = '0xee224d8e52bc9240eef248aaafa4b1a525c0f686da237620800ab549d1aba0ab'; // fictive
const VOTIUM_TRIBE_DISTRIBUTOR = '0x378Ba9B73309bE80BF4C2c027aAD799766a7ED5A'; // TRIBE are sent here

describe.only('votium-bribe', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let bribeSigner: any;
  let daoSigner: any;

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

    bribeSigner = await getImpersonatedSigner(contracts.opsOptimisticTimelock.address);
    await forceEth(contracts.opsOptimisticTimelock.address);
    daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
    await forceEth(contracts.feiDAOTimelock.address);
  });

  describe('When no voting round is active', async function () {
    it('should revert if proposal is not found', async function () {
      await contracts.core.connect(daoSigner).allocateTribe(contracts.votiumBriberD3pool.address, '1000');
      await expectRevert(contracts.votiumBriberD3pool.connect(bribeSigner).bribe(CVX_PROPOSAL, 44), 'invalid proposal');
    });
  });

  describe('When a voting round is active', async function () {
    before(async function () {
      // start a new votium bribe round
      const signer = await getImpersonatedSigner(VOTIUM_ADMIN);
      await forceEth(VOTIUM_ADMIN);
      await contracts.votiumBribe.connect(signer).initiateProposal(
        CVX_PROPOSAL, // snapshot proposal id
        Math.floor(((await time.latest()) * 1000 + 24 * 36e5) / 1000), // _deadline in 24h
        50 // maxIndex in the proposal
      );
    });

    it('should revert if index is out of boundaries', async function () {
      await expectRevert(contracts.votiumBriberD3pool.connect(bribeSigner).bribe(CVX_PROPOSAL, 55), 'invalid choice');
    });

    it('should revert if caller does not have VOTIUM_BRIBE_ADMIN_ROLE role', async function () {
      await expectRevert(
        contracts.votiumBriberD3pool
          .connect(await getImpersonatedSigner(VOTIUM_ADMIN)) // some address without role
          .bribe(CVX_PROPOSAL, 42),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });

    it('should revert if no tokens are available to bribe', async function () {
      // empty potential TRIBE on the contract
      const tribeBalance = await contracts.tribe.balanceOf(contracts.votiumBriberD3pool.address);
      await contracts.votiumBriberD3pool.withdrawERC20(contracts.tribe.address, contracts.core.address, tribeBalance);

      // bribe call should revert if there are no TRIBE to send
      await expectRevert(
        contracts.votiumBriberD3pool.connect(bribeSigner).bribe(CVX_PROPOSAL, 42),
        'VotiumBriber: no tokens to bribe'
      );
    });

    it('should allow VotiumBriber to bribe', async function () {
      // Should receive a non-zero rewards stream from TribalChief
      const briberBalanceBefore = await contracts.tribe.balanceOf(contracts.votiumBriberD3pool.address);
      await contracts.stakingTokenWrapperBribeD3pool.harvest();
      const briberBalanceAfter = await contracts.tribe.balanceOf(contracts.votiumBriberD3pool.address);
      const bribeAmount = briberBalanceAfter.sub(briberBalanceBefore);
      expect(bribeAmount).to.be.at.least(1);

      // >= 96% of rewards should be distributed as bribes (4% Votium platform fees)
      const distributorBalanceBefore = await contracts.tribe.balanceOf(VOTIUM_TRIBE_DISTRIBUTOR);
      await contracts.votiumBriberD3pool.connect(bribeSigner).bribe(CVX_PROPOSAL, 42);
      const distributorBalanceAfter = await contracts.tribe.balanceOf(VOTIUM_TRIBE_DISTRIBUTOR);
      const distributorAmount = distributorBalanceAfter.sub(distributorBalanceBefore);
      expect(distributorAmount).to.be.at.least(bribeAmount.mul(95).div(100));
    });

    it('should revert if paused and be able to claim back TRIBE', async function () {
      // Should receive a non-zero rewards stream from TribalChief
      const briberBalanceBefore = await contracts.tribe.balanceOf(contracts.votiumBriberD3pool.address);
      await contracts.stakingTokenWrapperBribeD3pool.harvest();
      const briberBalanceAfter = await contracts.tribe.balanceOf(contracts.votiumBriberD3pool.address);
      const bribeAmount = briberBalanceAfter.sub(briberBalanceBefore);
      expect(bribeAmount).to.be.at.least(1);

      // Pause briber
      await contracts.votiumBriberD3pool.connect(daoSigner).pause();

      // Call to bribe should revert
      await expectRevert(contracts.votiumBriberD3pool.connect(bribeSigner).bribe(CVX_PROPOSAL, 42), 'Pausable: paused');

      // DAO should be able to recover unspent TRIBE
      const balanceBefore = await contracts.tribe.balanceOf(contracts.core.address);
      await contracts.votiumBriberD3pool
        .connect(daoSigner)
        .withdrawERC20(contracts.tribe.address, contracts.core.address, bribeAmount);
      const balanceAfter = await contracts.tribe.balanceOf(contracts.core.address);
      const balanceRecovered = balanceAfter.sub(balanceBefore);
      expect(balanceRecovered).to.be.equal(bribeAmount);
    });
  });
});
