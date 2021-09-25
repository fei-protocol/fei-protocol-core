import hre, { ethers } from 'hardhat';
import { RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc } from '../../test/integration/setup/types';

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  const timelockAddress = addresses.timelockAddress;

  const {
    uniswapPCVDeposit,
    uniswapPCVController,
    bondingCurve,
    tribeReserveStabilizer,
    ratioPCVController,
    core,
    tribe
  } = contracts;

  const oldRatioPCVController = oldContracts.ratioPCVController;

  logging ? console.log('Granting Burner to new UniswapPCVController') : undefined;
  await core.grantBurner(uniswapPCVController.address);

  logging ? console.log('Granting Minter to new UniswapPCVController') : undefined;
  await core.grantMinter(uniswapPCVController.address);

  logging ? console.log('Granting Minter to new BondingCurve') : undefined;
  await core.grantMinter(bondingCurve.address);

  logging ? console.log('Granting Minter to new UniswapPCVDeposit') : undefined;
  await core.grantMinter(uniswapPCVDeposit.address);

  logging ? console.log('Granting Burner to new TribeReserveStabilizer') : undefined;
  await core.grantBurner(tribeReserveStabilizer.address);

  // special role
  // check via tribe contract
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });

  const timelockSigner = await ethers.getSigner(timelockAddress);

  logging ? console.log('Transferring TRIBE Minter role to TribeReserveStabilizer') : undefined;
  await tribe.connect(timelockSigner).setMinter(tribeReserveStabilizer.address);

  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [timelockAddress]
  });

  logging ? console.log('Granting PCVController to new RatioPCVController') : undefined;
  await core.grantPCVController(ratioPCVController.address);

  await oldRatioPCVController.withdrawRatio(oldContracts.uniswapPCVDeposit.address, uniswapPCVDeposit.address, '10000'); // move 100% of PCV from old -> new
};

/// /  --------------------- NOT RUN ON CHAIN ----------------------
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const core = contracts.core;

  const { uniswapPCVDeposit, uniswapPCVController, ratioPCVController, bondingCurve } = oldContracts;

  // Revoke controller permissions
  await core.revokeMinter(uniswapPCVController.address);
  await core.revokeMinter(uniswapPCVDeposit.address);
  await core.revokeMinter(bondingCurve.address);
  await core.revokeBurner(uniswapPCVController.address);
  await core.revokePCVController(ratioPCVController.address);
  await core.revokePCVController(uniswapPCVController.address);
};

module.exports = { setup, run, teardown };
