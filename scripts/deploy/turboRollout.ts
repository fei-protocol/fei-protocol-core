import { DeployUpgradeFunc } from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { ethers } from 'hardhat';
import * as ERC4626Json from './abis/ERC4626.sol/ERC4626.json';
import * as TurboBoosterJson from './abis/TurboBooster.sol/TurboBooster.json';
import * as TurboAdminJson from './abis/TurboAdmin.sol/TurboAdmin.json';

const toBN = ethers.BigNumber.from;

// Fuse pool 8 config
const POOL_8_SUPPLY_CAP = ethers.utils.parseEther('2000000'); // 2M, units of Fei
const POOL_8_FEI_STRATEGY_ADDRESS = '0xf486608dbc7dd0eb80e4b9fa0fdb03e40f414030';

// Fuse pool 18 config
const POOL_18_SUPPLY_CAP = ethers.utils.parseEther('2000000'); // 2M, units of Fei
const POOL_18_FEI_STRATEGY_ADDRESS = '0xaca81583840b1bf2ddf6cde824ada250c1936b4d';

// gOHM config
const GOHM_ADDRESS = '0x0ab87046fBb341D058F17CBC4c1133F25a20a52f';
const GOHM_DOLLAR_PRICE = 2955; // Approximate
const GOHM_DOLLAR_COLLATERAL_CAP = 5_000_000; // $5M
const GOHM_DOLLAR_BOOST_CAP = 1_000_000; // $1M
const GOHM_COLLATERAL_MANTISSA = ethers.utils.parseEther('0.8'); // 0.8e18

const gohmCollateralSupplyCap = ethers.constants.WeiPerEther.mul(
  toBN(GOHM_DOLLAR_COLLATERAL_CAP).div(toBN(GOHM_DOLLAR_PRICE))
); // 5M (1e18 * (max gOhm $ supply / gOhm $ price))
const gohmCollateralBoostCap = ethers.constants.WeiPerEther.mul(
  toBN(GOHM_DOLLAR_BOOST_CAP).div(toBN(GOHM_DOLLAR_PRICE))
);

// Bal config
const BAL_DOLLAR_PRICE = 15; // Approximate
const BAL_ADDRESS = '0xba100000625a3754423978a60c9317c58a424e3D';
const BAL_DOLLAR_COLLATERAL_CAP = 5_000_000; // $5M
const BAL_DOLLAR_BOOST_CAP = 1_000_000; // $1M
const BAL_COLLATERAL_MANTISSA = ethers.utils.parseEther('0.8'); // 0.8e18

const balCollateralSupplyCap = ethers.constants.WeiPerEther.mul(
  toBN(BAL_DOLLAR_COLLATERAL_CAP).div(toBN(BAL_DOLLAR_PRICE))
); // 5M (1e18 * (max bal $ supply / bal $ price))
const balCollateralBoostCap = ethers.constants.WeiPerEther.mul(toBN(BAL_DOLLAR_BOOST_CAP).div(toBN(BAL_DOLLAR_PRICE))); // 1M (1E18 * )

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
  const pool18Strategy = new ethers.Contract(POOL_18_FEI_STRATEGY_ADDRESS, ERC4626Json.abi, deploySigner);
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
  await turboAdminContract.addCollateral(
    BAL_ADDRESS,
    'Balancer',
    'BAL',
    BAL_COLLATERAL_MANTISSA,
    balCollateralSupplyCap
  );
  console.log('Added BAL collateral');

  await turboAdminContract.addCollateral(
    GOHM_ADDRESS,
    'Governance OHM',
    'gOHM',
    GOHM_COLLATERAL_MANTISSA,
    gohmCollateralSupplyCap
  );
  console.log('Added gOHM collateral');

  await validateAddedCollateral();

  // 4. Set boost caps for new collateral types
  console.log('Setting boost supply caps');
  await turboBoosterContract.setBoostCapForCollateral(BAL_ADDRESS, balCollateralBoostCap);
  console.log('Set BAL supply cap');

  await turboBoosterContract.setBoostCapForCollateral(GOHM_ADDRESS, gohmCollateralBoostCap);
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
