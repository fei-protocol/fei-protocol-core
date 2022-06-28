import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';
import { getImpersonatedSigner, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*

TIP-114: Deprecate TRIBE Incentives system

*/

const fipNumber = 'TIP-114: Deprecate TRIBE Incentives system';

let initialCoreTribeBalance: BigNumber;
let initialRariDelegatorBalance: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy implementation
  const vlAuraDelegatorPCVDepositFactory = await ethers.getContractFactory('VlAuraDelegatorPCVDeposit');
  const vlAuraDelegatorPCVDepositImplementation = await vlAuraDelegatorPCVDepositFactory.deploy(addresses.core);
  await vlAuraDelegatorPCVDepositImplementation.deployTransaction.wait();
  logging && console.log('vlAuraDelegatorPCVDepositImplementation: ', vlAuraDelegatorPCVDepositImplementation.address);

  return {
    vlAuraDelegatorPCVDepositImplementation
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const tribe = contracts.tribe;

  initialCoreTribeBalance = await tribe.balanceOf(addresses.core);
  initialRariDelegatorBalance = await tribe.balanceOf(addresses.rariRewardsDistributorDelegator);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const tribe = contracts.tribe;
  const core = contracts.core;
  const tribalChief = contracts.tribalChief;

  const minExpectedTribeRecovery = ethers.constants.WeiPerEther.mul(30_000_000);
  const remainingTRIBELPRewards = ethers.constants.WeiPerEther.mul(564_000);
  const excessRariTribeToExtract = ethers.constants.WeiPerEther.mul(150_000);
  const maxRemainingExtraChiefBalance = ethers.constants.WeiPerEther.mul(30_000);

  // 0. Verify all staking token wrapper pending rewards are zero
  expect(await tribalChief.pendingRewards(3, addresses.stakingTokenWrapperRari)).to.equal(0);
  expect(await tribalChief.pendingRewards(4, addresses.stakingTokenWrapperGROLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(5, addresses.stakingTokenWrapperFOXLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(6, addresses.stakingTokenWrapperUMALaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(7, addresses.stakingTokenWrapperSYNLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(8, addresses.stakingTokenWrapperNEARLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(9, addresses.stakingTokenWrapperKYLINLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(10, addresses.stakingTokenWrapperMStableLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(11, addresses.stakingTokenWrapperPoolTogetherLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(12, addresses.stakingTokenWrapperBribeD3pool)).to.equal(0);
  expect(await tribalChief.pendingRewards(13, addresses.d3StakingTokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(14, addresses.fei3CrvStakingtokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(15, addresses.feiDaiStakingTokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(16, addresses.feiUsdcStakingTokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(17, addresses.stakingTokenWrapperBribe3Crvpool)).to.equal(0);

  // 1. Validate all the locations TRIBE was withdrawn from are empty
  expect(await tribe.balanceOf(addresses.votiumBriber3Crvpool)).to.equal(0);
  expect(await tribe.balanceOf(addresses.erc20Dripper)).to.equal(0);
  expect(await tribe.balanceOf(addresses.votiumBriberD3pool)).to.equal(0);

  // 2. Validate TribalChief has sufficient TRIBE to fund LP staking deposits
  expect(await tribe.balanceOf(addresses.tribalChief)).to.be.bignumber.at.least(remainingTRIBELPRewards);

  // Validate remaining balance of TribalChief is small
  const finalTribalChiefBalance = await tribe.balanceOf(addresses.tribalChief);
  console.log('Final TribalChief balance:', finalTribalChiefBalance.toString());
  expect(finalTribalChiefBalance).to.be.bignumber.lessThan(maxRemainingExtraChiefBalance.add(remainingTRIBELPRewards));

  // 3. Validate excess TRIBE was pulled from Rari rewards delegate
  const finalRariDelegatorBalance = await tribe.balanceOf(addresses.rariRewardsDistributorDelegator);
  const extractedRariTribe = initialRariDelegatorBalance.sub(finalRariDelegatorBalance);
  expect(extractedRariTribe).to.be.bignumber.at.least(excessRariTribeToExtract); // At least check, as rewards may have been claimed also

  // 4. Validate expected TRIBE recovery amount was retrieved
  const finalCoreTribeBalance = await tribe.balanceOf(addresses.core);
  const tribeRecovered = finalCoreTribeBalance.sub(initialCoreTribeBalance);
  console.log('Tribe recovered: ', tribeRecovered.toString());
  expect(tribeRecovered).to.be.bignumber.at.least(minExpectedTribeRecovery);

  // 5. Validate Aave incentives controller proxy admin was changed
  const aaveLendingPoolAddressesProviderSigner = await getImpersonatedSigner(
    addresses.aaveLendingPoolAddressesProvider
  );
  const proxyABI = ['function admin() returns (address)'];
  const aaveTribeIncentivesControllerAsProxy = new ethers.Contract(addresses.aaveTribeIncentivesController, proxyABI);
  await forceEth(addresses.aaveTribeIncentivesController);
  expect(
    await aaveTribeIncentivesControllerAsProxy.connect(aaveLendingPoolAddressesProviderSigner).callStatic.admin()
  ).to.be.equal(addresses.aaveLendingPoolAddressesProvider);

  // 6. Validate TRIBAL_CHIEF_ADMIN_ROLE is revoked
  expect(await core.hasRole(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.tribalCouncilTimelock)).to.be.false;
  expect(await core.hasRole(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.optimisticTimelock)).to.be.false;

  // Aura Airdrop check
  // We have to fast forward to next week, because AURA locking works per epoch and if we checked
  // the vlAURA balance right after execution, it would be 0.
  await time.increase(7 * 24 * 3600 + 1);
  expect(await contracts.vlAuraDelegatorPCVDeposit.aura()).to.be.equal(addresses.aura);
  expect(await contracts.vlAuraDelegatorPCVDeposit.auraLocker()).to.be.equal(addresses.vlAura);
  expect(await contracts.vlAuraDelegatorPCVDeposit.auraMerkleDrop()).to.be.equal(addresses.auraMerkleDrop);
  expect(await contracts.vlAuraDelegatorPCVDeposit.token()).to.be.equal(addresses.vlAura);
  expect(await contracts.vlAuraDelegatorPCVDeposit.delegate()).to.be.equal(addresses.eswak);
  const auraLocked = await contracts.vlAura.balanceOf(contracts.vlAuraDelegatorPCVDeposit.address);
  expect(auraLocked).to.be.at.least(ethers.utils.parseEther('23438'));
  const auraBalance = await contracts.vlAuraDelegatorPCVDeposit.balance();
  expect(auraBalance).to.be.at.least(ethers.utils.parseEther('23438'));
};

export { deploy, setup, teardown, validate };
