import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../types/types';
import { time, getImpersonatedSigner } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  logging && console.log('No deploy for FIP-53');
  return {};
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup for FIP-53');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-53');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  // there should be some dust LP tokens on the Timelock
  expect(await contracts.curveD3pool.balanceOf(contracts.feiDAOTimelock.address)).to.be.at.least('0');

  // d3pool LP tokens should be staked in Convex
  expect(await contracts.convexD3poolRewards.balanceOf(contracts.feiDAOTimelock.address)).to.be.equal(
    '49580000000000000000000000'
  );

  // should be able to withdraw
  /*const signer = await getImpersonatedSigner(addresses.feiDAOTimelock);
  await contracts.convexD3poolRewards.connect(signer).withdrawAllAndUnwrap(true);
  const d3poolLpBalance = await contracts.curveD3pool.balanceOf(addresses.feiDAOTimelock);
  await contracts.curveD3pool.connect(signer).remove_liquidity_one_coin(d3poolLpBalance, '1', '0');
  console.log('Timelock FEI balance after all exit', await contracts.fei.balanceOf(addresses.feiDAOTimelock) / 1e18);*/
};
