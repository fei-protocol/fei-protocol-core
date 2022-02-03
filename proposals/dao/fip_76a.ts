import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*

OA Proposal 76a

Description: Add LUSD market on FeiRari with similar parameter to DAI

Steps:
  1 - Add LUSD oracle to FeiRari
  2 - Add LUSD market to FeiRari
  3 - Raise G-UNI DAI/FEI supply cap 4x
*/

const fipNumber = '76a';

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
  const LUSD_WHALE = '0x66017D22b0f8556afDd19FC67041899Eb65a21bb'; // stability pool
  await forceEth(LUSD_WHALE);
  const lusdSigner = await getImpersonatedSigner(LUSD_WHALE);
  const USER_ADDRESS = '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148'; // eswak.eth
  await contracts.lusd.connect(lusdSigner).transfer(USER_ADDRESS, ethers.constants.WeiPerEther.mul(100_000));
  const signer = await getImpersonatedSigner(USER_ADDRESS);

  // get LUSD cToken
  const lusdCTokenAddress = await contracts.rariPool8Comptroller.cTokensByUnderlying(addresses.lusd);
  const lusdCToken = await ethers.getContractAt('CErc20Delegator', lusdCTokenAddress, signer);
  // deposit LUSD as collateral in FeiRari
  await contracts.rariPool8Comptroller.connect(signer).enterMarkets([lusdCTokenAddress]);
  await contracts.lusd.connect(signer).approve(lusdCTokenAddress, ethers.constants.WeiPerEther.mul(100_000));
  await lusdCToken.mint(ethers.constants.WeiPerEther.mul(100_000));
  // borrow LUSD in FeiRari
  await lusdCToken.borrow(ethers.constants.WeiPerEther.mul(79_000));
  // invariant check for LUSD borrowed
  expect(await contracts.lusd.balanceOf(signer.address)).to.be.equal(ethers.constants.WeiPerEther.mul(79_000));
  // invariant check for new G-UNI DAI/FEI 4x supply cap increase
  const gUniFeiDaiLPCTokenAddress = await contracts.rariPool8Comptroller.cTokensByUnderlying(addresses.gUniFeiDaiLP);
  expect(await contracts.rariPool8Comptroller.supplyCaps(gUniFeiDaiLPCTokenAddress)).to.be.equal(
    // G-UNI tokens have a 100x factor vs underlying,
    // so 10B G-UNI tokens is 100M$ liquidity
    ethers.constants.WeiPerEther.mul(10_000_000_000)
  );
};

export { deploy, setup, teardown, validate };
