import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { forceEth } from '@test/integration/setup/utils';
import { getImpersonatedSigner, time } from '@test/helpers';

/*

Withdraw from Tokemak

*/

const fipNumber = 'tokemak_withdraw';

const IPFS_JSON_FILE_HASH = 'QmP4Vzg45jExr3mcNsx9xxV1fNft95uVzgZGeLtkBXgpkx';

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
  console.log(`No actions to complete in setup for fip${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const ethTokemakPCVDeposit = contracts.ethTokemakPCVDeposit;

  // Validate that DAO can withdraw funds in the next cycle
  // impersonate the rollover signer, and make the Tokemak pool go to next cycle
  await forceEth(addresses.tokemakManagerRollover);
  const tokemakRolloverSigner = await getImpersonatedSigner(addresses.tokemakManagerRollover);
  const tokemakManagerAbi = [
    'function nextCycleStartTime() view returns (uint256)',
    'function completeRollover(string calldata rewardsIpfsHash)'
  ];
  const tokemakManager = new ethers.Contract(addresses.tokemakManager, tokemakManagerAbi, tokemakRolloverSigner);
  const cycleEnd = await tokemakManager.nextCycleStartTime();
  await time.increaseTo(cycleEnd + 1);
  await tokemakManager.completeRollover(IPFS_JSON_FILE_HASH);

  // Perform withdraw
  await ethTokemakPCVDeposit.withdraw(ethTokemakPCVDeposit.address, ethers.constants.WeiPerEther.mul(10_000));

  // Should end with 0 tWETH, 10k ETH
  expect((await contracts.tWETH.balanceOf(ethTokemakPCVDeposit.address)).toString()).to.be.equal(
    ethers.utils.parseEther('0')
  );
  expect((await ethers.provider.getBalance(ethTokemakPCVDeposit.address)).toString()).to.be.equal(
    ethers.utils.parseEther('10000')
  );
};

export { deploy, setup, teardown, validate };
