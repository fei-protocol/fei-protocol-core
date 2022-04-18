import { DeployUpgradeFunc } from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { ethers } from 'hardhat';
import * as ERC4626Json from './abis/ERC4626.sol/ERC4626.json';
import * as TurboBoosterJson from './abis/TurboBooster.sol/TurboBooster.json';
import * as TurboAdminJson from './abis/TurboAdmin.sol/TurboAdmin.json';

// Fuse pool 8 config
const POOL_8_FEI_C_TOKEN = '0xd8553552f8868C1Ef160eEdf031cF0BCf9686945';
const POOL_8_NAME = 'Pool8Shares';
const POOL_8_SYMBOL = 'P8S';
const POOL_8_SUPPLY_CAP = ethers.utils.parseEther('2000000'); // 2M

const POOL_8_FEI_STRATEGY_ADDRESS = '0xefab0beb0a557e452b398035ea964948c750b2fd';

// Fuse pool 18 config
const POOL_18_FEI_C_TOKEN = '0x17b1A2E012cC4C31f83B90FF11d3942857664efc';
const POOL_18_NAME = 'Pool8Shares';
const POOL_18_SYMBOL = 'P18S';
const POOL_18_SUPPLY_CAP = ethers.utils.parseEther('2000000'); // 2M

const POOL_18_FEI_STRATEGY_ADDRESS = '0xaca81583840b1bf2ddf6cde824ada250c1936b4d';

// gOHM config
const GOHM = '0x0ab87046fBb341D058F17CBC4c1133F25a20a52f';
const GOHM_COLLATERAL_SUPPLY_CAP = ethers.utils.parseEther('500000'); // 500k
const GOHM_COLLATERAL_MANTISSA = ethers.utils.parseEther('0.8'); // 0.8e18
const GOHM_COLLATERAL_BOOST_CAP = ethers.utils.parseEther('1000000'); // 1M

// Bal config
const BAL = '0xba100000625a3754423978a60c9317c58a424e3D';
const BAL_COLLATERAL_SUPPLY_CAP = ethers.utils.parseEther('500000'); // 500k
const BAL_COLLATERAL_MANTISSA = ethers.utils.parseEther('0.8'); // 0.8e18
const BAL_COLLATERAL_BOOST_CAP = ethers.utils.parseEther('1000000'); // 1M

// Turbo admin config
const TURBO_ADMIN_ADDRESS = '0x64c4Bffb220818F0f2ee6DAe7A2F17D92b359c5d';

const IS_MAINNET_DEPLOY = process.env.IS_MAINNET_DEPLOY;

// To test: Fork mainnet onto local hardhat node. Validate all passes
export const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  let deploySigner = (await ethers.getSigners())[0];
  console.log('Signer address: ', deploySigner.address);

  if (IS_MAINNET_DEPLOY && (deployAddress != TURBO_ADMIN_ADDRESS || deploySigner.address != TURBO_ADMIN_ADDRESS)) {
    throw new Error('Incorrect deploy address');
  }

  if (!IS_MAINNET_DEPLOY) {
    deploySigner = await getImpersonatedSigner(TURBO_ADMIN_ADDRESS);
  }

  if (POOL_18_FEI_STRATEGY_ADDRESS.length === 0 || POOL_8_FEI_STRATEGY_ADDRESS.length === 0) {
    throw new Error('FEI strategy not set');
  }

  // 1. Instantitate ERC4626 strategy types
  const pool8Strategy = new ethers.Contract(POOL_8_FEI_STRATEGY_ADDRESS, ERC4626Json.abi, deploySigner);
  const pool18Strategy = new ethers.Contract(POOL_18_FEI_C_TOKEN, ERC4626Json.abi, deploySigner);
  await validateStrategyDeploys();

  // 2. Set boost caps
  console.log('Setting boost caps...');
  const turboBoosterContract = new ethers.Contract(addresses.turboBooster, TurboBoosterJson.abi, deploySigner);
  await turboBoosterContract.setBoostCapForVault(pool8Strategy.address, POOL_8_SUPPLY_CAP);
  console.log('Set pool 8 supply cap');
  await turboBoosterContract.setBoostCapForVault(pool18Strategy.address, POOL_18_SUPPLY_CAP);
  console.log('Set pool 18 supply cap');
  await validateBoostSupplyCaps();

  // 3. Add BAL and gOHM collaterals
  const turboAdminContract = new ethers.Contract(addresses.turboAdmin, TurboAdminJson.abi, deploySigner);
  await turboAdminContract.addCollateral(BAL, 'Balancer', 'BAL', BAL_COLLATERAL_MANTISSA, BAL_COLLATERAL_SUPPLY_CAP);
  console.log('Added BAL collateral');

  await turboAdminContract.addCollateral(
    GOHM,
    'Governance OHM',
    'gOHM',
    GOHM_COLLATERAL_MANTISSA,
    GOHM_COLLATERAL_SUPPLY_CAP
  );
  console.log('Added gOHM collateral');

  await validateAddedCollateral();

  // 4. Set boost caps for new collateral types
  console.log('Setting boost supply caps');
  await turboBoosterContract.setBoostCapForCollateral(BAL, BAL_COLLATERAL_BOOST_CAP);
  console.log('Set BAL supply cap');

  await turboBoosterContract.setBoostCapForCollateral(GOHM, GOHM_COLLATERAL_BOOST_CAP);
  console.log('Set gOHM supply cap');

  await validateCollateralBoostCaps();
  return {};
};

async function validateStrategyDeploys() {
  console.log('Validating strategy deploys...');
}

async function validateBoostSupplyCaps() {
  console.log('Validating boost supply caps...');
}

async function validateAddedCollateral() {
  console.log('Validating added collateral...');
}

async function validateCollateralBoostCaps() {
  console.log('Validating collateral boost caps...');
}
