import { DeployUpgradeFunc } from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { ethers } from 'hardhat';
import * as ERC4626Json from './abis/ERC4626.sol/ERC4626.json';
import * as TurboBoosterJson from './abis/TurboBooster.sol/TurboBooster.json';
import * as TurboAdminJson from './abis/TurboAdmin.sol/TurboAdmin.json';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { pool8Config, pool18Config, gOhmConfig, balConfig } from './turboRolloutConfig';

// Turbo admin config
const TURBO_ADMIN_ADDRESS = '0x64c4Bffb220818F0f2ee6DAe7A2F17D92b359c5d';
const IS_MAINNET_DEPLOY = process.env.IS_MAINNET_DEPLOY;

export const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  let deploySigner = (await ethers.getSigners())[0];
  console.log('Signer address: ', deploySigner.address);

  if (IS_MAINNET_DEPLOY && (deployAddress != TURBO_ADMIN_ADDRESS || deploySigner.address != TURBO_ADMIN_ADDRESS)) {
    throw new Error('Incorrect deploy address');
  }

  if (!IS_MAINNET_DEPLOY) {
    console.log('Deploying to testrpc...');
    deploySigner = await getImpersonatedSigner(TURBO_ADMIN_ADDRESS);
  }

  if (pool18Config.feiERC4626StrategyAddress.length === 0 || pool8Config.feiERC4626StrategyAddress.length === 0) {
    throw new Error('FEI strategy not set');
  }

  // 1. Instantitate ERC4626 strategy types
  const pool8Strategy = new ethers.Contract(pool8Config.feiERC4626StrategyAddress, ERC4626Json.abi, deploySigner);
  const pool18Strategy = new ethers.Contract(pool18Config.feiERC4626StrategyAddress, ERC4626Json.abi, deploySigner);

  // 2. Set boost caps
  // console.log('Setting boost caps...');
  const turboBoosterContract = new ethers.Contract(addresses.turboBooster, TurboBoosterJson.abi, deploySigner);
  const pool8Tx = await turboBoosterContract.setBoostCapForVault(pool8Strategy.address, pool8Config.supplyCap);
  await pool8Tx.wait();

  const pool18Tx = await turboBoosterContract.setBoostCapForVault(pool18Strategy.address, pool18Config.supplyCap);
  await pool18Tx.wait();
  await validateBoostSupplyCaps(turboBoosterContract, pool8Strategy.address, pool18Strategy.address);

  // 3. Add BAL and gOHM collaterals
  const turboAdminContract = new ethers.Contract(addresses.turboAdmin, TurboAdminJson.abi, deploySigner);
  const balResponseTx = await turboAdminContract.addCollateral(
    balConfig.address,
    'Balancer',
    'BAL',
    balConfig.collateralMantissa,
    balConfig.feiDenomCollateralCap
  );
  await balResponseTx.wait();
  console.log('Added BAL collateral');

  const gOHMResponseTx = await turboAdminContract.addCollateral(
    gOhmConfig.address,
    'Governance OHM',
    'gOHM',
    gOhmConfig.collateralMantisa,
    gOhmConfig.feiDenomCollateralCap
  );
  await gOHMResponseTx.wait();
  console.log('Added gOHM collateral');

  // 4. Set boost caps for new collateral types
  console.log('Setting boost supply caps');
  const balBoostCapTx = await turboBoosterContract.setBoostCapForCollateral(
    balConfig.address,
    balConfig.feiDenomBoostCap
  );
  await balBoostCapTx.wait();

  const gOHMBoostCapTx = await turboBoosterContract.setBoostCapForCollateral(
    gOhmConfig.address,
    gOhmConfig.feiDenomBoostCap
  );
  await gOHMBoostCapTx.wait();
  await validateCollateralBoostCaps(turboBoosterContract);
  console.log('Finished');
  return {};
};

async function validateBoostSupplyCaps(turboBoosterContract: Contract, pool8Strategy: string, pool18Strategy: string) {
  console.log('Validating boost supply caps...');
  const pool8SupplyCap = await turboBoosterContract.getBoostCapForVault(pool8Strategy);
  expect(pool8SupplyCap).to.equal(pool8Config.supplyCap);
  const gohmSupplyCap = await turboBoosterContract.getBoostCapForVault(pool18Strategy);
  expect(gohmSupplyCap).to.equal(pool18Config.supplyCap);
}

async function validateCollateralBoostCaps(turboBoosterContract: Contract) {
  console.log('Validating collateral boost caps...');
  const balBoostCap = await turboBoosterContract.getBoostCapForCollateral(balConfig.address);
  expect(balBoostCap).to.equal(balConfig.feiDenomBoostCap);

  const gohmBoostCap = await turboBoosterContract.getBoostCapForCollateral(gOhmConfig.address);
  expect(gohmBoostCap).to.equal(gOhmConfig.feiDenomBoostCap);
}
