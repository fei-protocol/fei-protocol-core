import { TribalChief, Tribe } from '@custom-types/contracts';
import { NamedContracts } from '@custom-types/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import proposals from '@protocol/proposalsConfig';
import { getImpersonatedSigner, resetFork, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { TestEndtoEndCoordinator } from '../setup';

const toBN = ethers.BigNumber.from;
chai.use(CBN(ethers.BigNumber));
chai.use(solidity);

describe.skip('e2e-end-tribe-incentives', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let tribe: Tribe;
  let tribalChief: TribalChief;
  let curveLPStaker: SignerWithAddress;

  const receiver = '0xbEA4B2357e8ec53AF60BbcA4bc570332a7C7E232';
  const curvePoolId = 1;
  const curve3LPWhale = '0xdc69d4cb5b86388fff0b51885677e258883534ae';
  const pool8User = '0x9544A83A8cB74062c836AA11565d4BB4A54fe40D';

  beforeEach(async function () {
    await resetFork();

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

    tribe = contracts.tribe as Tribe;
    tribalChief = contracts.tribalChief as TribalChief;

    curveLPStaker = await getImpersonatedSigner(curve3LPWhale);
    await forceEth(curve3LPWhale);
  });

  it('should NOT be able to harvest future TRIBE rewards from an LP pool', async () => {
    // Advance time, to check that rewards aren't accruing
    await time.increase(86400);

    // Attempt to harvest again. As rewards have been stopped, it should not harvest any Tribe
    const balanceBeforeHarvest = await tribe.balanceOf(receiver);
    await tribalChief.connect(curveLPStaker).harvest(curvePoolId, receiver);
    const balanceAfterHarvest = await tribe.balanceOf(receiver);

    const harvestedTribe = balanceAfterHarvest.sub(balanceBeforeHarvest);
    expect(harvestedTribe).to.equal(0);
  });

  it('should be able to harvest existing TRIBE rewards from an AutoRewardDistributor in a Fuse pool', async () => {
    const { rariRewardsDistributorDelegator, tribe } = contracts;

    // Market participant claims TRIBE rewards
    const userBalanceBefore = await tribe.balanceOf(pool8User);
    await rariRewardsDistributorDelegator['claimRewards(address)'](pool8User);
    const userBalanceAfter = await tribe.balanceOf(pool8User);
    const userHarvestedTribe = userBalanceAfter.sub(userBalanceBefore);
    expect(userHarvestedTribe).to.be.bignumber.at.least(toBN(1));
  });

  it('should NOT be able to harvest future TRIBE rewards from an AutoRewardDistributor in a Fuse pool', async () => {
    const { rariRewardsDistributorDelegator, stakingTokenWrapperRari, tribe } = contracts;

    // 1. Harvest staking token wrapper to clear out all earned rewards. User also harvests their rewards
    await stakingTokenWrapperRari.harvest();
    await rariRewardsDistributorDelegator['claimRewards(address)'](pool8User);

    // Fast forward time by a few blocks
    await time.increase(86400 * 7);

    // 2. Attempt to harvest more rewards for ARD from Staking Token wrapper. Should harvest 0, as rewards have stopped
    const ardBalanceBefore = await tribe.balanceOf(rariRewardsDistributorDelegator.address);
    await stakingTokenWrapperRari.harvest();
    const ardBalanceAfter = await tribe.balanceOf(rariRewardsDistributorDelegator.address);
    const ardHarvestedTribe = ardBalanceAfter.sub(ardBalanceBefore);
    expect(ardHarvestedTribe).to.equal(0);

    // 3. Have user attempt to harvest TRIBE rewards, should harvest 0 TRIBE
    const userBalanceBefore = await tribe.balanceOf(pool8User);
    await rariRewardsDistributorDelegator['claimRewards(address)'](pool8User);
    const userBalanceAfter = await tribe.balanceOf(pool8User);
    const userHarvestedTribe = userBalanceAfter.sub(userBalanceBefore);
    expect(userHarvestedTribe).to.equal(0);
  });
});
