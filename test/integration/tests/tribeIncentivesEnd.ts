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
import { TribalChief, Tribe } from '@custom-types/contracts';

const toBN = ethers.BigNumber.from;

describe('e2e-end-tribe-incentives', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let tribe: Tribe;
  let tribalChief: TribalChief;
  const receiver = '0xbEA4B2357e8ec53AF60BbcA4bc570332a7C7E232';

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

    tribe = contracts.tribe as Tribe;
    tribalChief = contracts.tribalChief as TribalChief;
  });

  it('should be able to harvest existing TRIBE rewards and withdraw principle from an LP pool', async () => {
    const initialBalance = await tribe.balanceOf(receiver);

    const poolId = 1;
    const curve3Metapool = '0x06cb22615BA53E60D67Bf6C341a0fD5E718E1655';
    const stakerInPool = '0x019EdcB493Bd91e2b25b70f26D5d9041Fd7EF946';
    const stakerInPoolSigner = await getImpersonatedSigner(stakerInPool);
    await forceEth(stakerInPool);

    const curveLPToken = await ethers.getContractAt('ERC20', curve3Metapool);

    // Harvest already earnt TRIBE rewards
    await tribalChief.connect(stakerInPoolSigner).harvest(poolId, receiver);
    const finalBalance = await tribe.balanceOf(receiver);
    const harvestedTribe = finalBalance.sub(initialBalance);
    expect(harvestedTribe).to.be.bignumber.at.least(toBN(1));

    // Withdraw principle from staked pool
    const receiverBalanceBefore = await curveLPToken.balanceOf(receiver);
    await tribalChief.connect(stakerInPoolSigner).withdrawAllAndHarvest(poolId, receiver);
    const receiverBalanceAfter = await curveLPToken.balanceOf(receiver);
    const withdrawnPrinciple = receiverBalanceAfter.sub(receiverBalanceBefore);
    expect(withdrawnPrinciple).to.be.bignumber.at.least(toBN(1));
  });

  it('should NOT be able to harvest future TRIBE rewards from an LP pool', async () => {
    // Fast forward time by a few blocks
    // Try to withdraw
    // Should withdraw basically zero
  });

  it('should be able to harvest existing TRIBE rewards and withdraw principle from an AutoRewardDistributor in a Fuse pool', async () => {
    // Find a staker in a Rari pool eligible for rewards
  });

  it('should NOT be able to harvest future TRIBE rewards from an AutoRewardDistributor in a Fuse pool', async () => {
    // Fast forward time by a few blocks
    // Try to withdraw
    // Should withdraw basically zero
  });
});
