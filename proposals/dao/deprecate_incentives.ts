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
import { getImpersonatedSigner } from '@test/helpers';
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
  console.log(`No deploy actions for fip${fipNumber}`);
  return {
    // put returned contract objects here
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

  const expectedTribeRecovery = ethers.constants.WeiPerEther.mul(40_000_000);
  const remainingTRIBELPRewards = ethers.constants.WeiPerEther.mul(100_000);
  const excessRariTribeToExtract = ethers.constants.WeiPerEther.mul(164_000);

  // 1. Validate all the locations TRIBE was withdrawn from are empty
  expect(await tribe.balanceOf(addresses.votiumBriber3Crvpool)).to.equal(0);
  expect(await tribe.balanceOf(addresses.erc20Dripper)).to.equal(0);
  expect(await tribe.balanceOf(addresses.votiumBriberD3pool)).to.equal(0);
  expect(await tribe.balanceOf(addresses.feiDAOTimelock)).to.equal(0);

  // 2. Validate TribalChief has sufficient TRIBE to fund LP staking deposits
  expect(await tribe.balanceOf(addresses.tribalChief)).to.be.bignumber.at.least(remainingTRIBELPRewards);

  // 3. Validate excess TRIBE was pulled from Rari rewards delegate
  const finalRariDelegatorBalance = await tribe.balanceOf(addresses.rariRewardsDistributorDelegator);
  const extractedRariTribe = initialRariDelegatorBalance.sub(finalRariDelegatorBalance);
  expect(extractedRariTribe).to.be.bignumber.at.least(excessRariTribeToExtract); // At least check, as rewards may have been claimed also

  // 4. Validate expected TRIBE recovery amount was retrieved
  const finalCoreTribeBalance = await tribe.balanceOf(addresses.core);
  const tribeRecovered = finalCoreTribeBalance.sub(initialCoreTribeBalance);
  console.log('Tribe recovered: ', tribeRecovered.toString());
  expect(tribeRecovered).to.be.bignumber.at.least(expectedTribeRecovery);

  // 5. Validate Aave incentives controller proxy admin was changed - should revert as DAO no longer proxy admin
  const aaveLendingPoolAddressesProviderSigner = await getImpersonatedSigner(
    addresses.aaveLendingPoolAddressesProvider
  );
  const proxyABI = ['function admin() returns (address)'];
  const aaveTribeIncentivesControllerAsProxy = new ethers.Contract(addresses.aaveTribeIncentivesController, proxyABI);
  await forceEth(addresses.aaveTribeIncentivesController);
  expect(
    await aaveTribeIncentivesControllerAsProxy.connect(aaveLendingPoolAddressesProviderSigner).callStatic.admin()
  ).to.be.equal(addresses.aaveLendingPoolAddressesProvider);
};

export { deploy, setup, teardown, validate };
