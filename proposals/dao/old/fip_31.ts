import { ethers } from 'hardhat';
import { expect } from 'chai';
import { RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../types/types';

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

/*
 0. Update timelock to FeiDAOTimelock
 1. Grant Governor to FeiDAOTimelock 
 2. Grant PCVController to FeiDAOTimelock
 3. Revoke PCVController from old Timelock
 4. Grant Minter to FeiDAOTimelock
 5. Revoke Minter from old Timelock
 6. Transfer 1M kashi DPI LP tokens to OA Timelock
 7. Transfer 2.5M kashi ETH LP tokens to OA Timelock
 8. Transfer 2.5M kashi TRIBE LP tokens to OA Timelock
 9. Transfer 2.5M kashi xSUSHI LP tokens to OA Timelock
*/
export const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { feiDAO, core, kashiFeiDPI, kashiFeiEth, kashiFeiTribe, kashiFeiXSushi } = contracts;
  const { timelock, feiDAOTimelock, optimisticTimelock } = addresses;

  expect(await feiDAO.timelock()).to.be.equal(feiDAOTimelock);

  expect(await core.isGovernor(feiDAOTimelock)).to.be.true;
  expect(await core.isGovernor(timelock)).to.be.true;
  expect(await core.isPCVController(feiDAOTimelock)).to.be.true;
  expect(await core.isPCVController(timelock)).to.be.false;
  expect(await core.isMinter(feiDAOTimelock)).to.be.true;
  expect(await core.isMinter(timelock)).to.be.false;

  expect((await kashiFeiDPI.balanceOf(optimisticTimelock)).toString()).to.be.equal(
    ethers.constants.WeiPerEther.mul(1_000_000).toString()
  );
  expect((await kashiFeiEth.balanceOf(optimisticTimelock)).toString()).to.be.equal(
    ethers.constants.WeiPerEther.mul(2_500_000).toString()
  );
  expect((await kashiFeiTribe.balanceOf(optimisticTimelock)).toString()).to.be.equal(
    ethers.constants.WeiPerEther.mul(2_500_000).toString()
  );
  expect((await kashiFeiXSushi.balanceOf(optimisticTimelock)).toString()).to.be.equal(
    ethers.constants.WeiPerEther.mul(2_500_000).toString()
  );
};
