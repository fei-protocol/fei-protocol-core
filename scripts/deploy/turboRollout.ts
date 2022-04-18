import { DeployUpgradeFunc } from '@custom-types/types';
import { Console } from 'console';
import { ethers } from 'hardhat';

// Fuse pool 8 config
const POOL_8_C_TOKEN = '';
const POOL_8_NAME = 'Pool8Shares';
const POOL_8_SYMBOL = 'P8S';
const POOL_8_SUPPLY_CAP = ethers.utils.parseEther('1000000'); // 1M

// Fuse pool 18 config
const POOL_18_C_TOKEN = '';
const POOL_18_NAME = 'Pool8Shares';
const POOL_18_SYMBOL = 'P8S';
const POOL_18_SUPPLY_CAP = ethers.utils.parseEther('1000000'); // 1M

// gOHM config
const GOHM = '0x0ab87046fBb341D058F17CBC4c1133F25a20a52f';
const GOHM_COLLATERAL_SUPPLY_CAP = ethers.utils.parseEther('1000000'); // 1M
const GOHM_COLLATERAL_MANTISSA = ethers.utils.parseEther('2'); // TODO
const GOHM_COLLATERAL_BOOST_CAP = ethers.utils.parseEther('1000000'); // TODO

// Bal config
const BAL = '0xba100000625a3754423978a60c9317c58a424e3D';
const BAL_COLLATERAL_SUPPLY_CAP = ethers.utils.parseEther('1000000'); // 1M
const BAL_COLLATERAL_MANTISSA = ethers.utils.parseEther('2'); // TODO
const BAL_COLLATERAL_BOOST_CAP = ethers.utils.parseEther('1000000'); // TODO

// Turbo admin config
const TURBO_ADMIN_ADDRESS = '0x64c4Bffb220818F0f2ee6DAe7A2F17D92b359c5d';

// To test: Fork mainnet onto local hardhat node. Validate all passes
export const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  const deploySigner = (await ethers.getSigners())[0];
  console.log('Signer address: ', deploySigner.address);
  console.log('Deploy address: ', deployAddress);

  if (deployAddress != TURBO_ADMIN_ADDRESS || deploySigner.address != TURBO_ADMIN_ADDRESS) {
    throw new Error('Incorrect deploy address');
  }

  // 1. Deploy Fei fuse strategies
  console.log('Deploying Fuse strategies...');
  const fuseERC4626Factory = await ethers.getContractFactory('FuseERC4626');
  const pool8Strategy = await fuseERC4626Factory.deploy(POOL_8_C_TOKEN, POOL_8_NAME, POOL_8_SYMBOL);
  await pool8Strategy.deployTransaction.wait();
  console.log('Pool 8 strategy deployed to: ', pool8Strategy.address);

  const pool18Strategy = await fuseERC4626Factory.deploy(POOL_18_C_TOKEN, POOL_18_NAME, POOL_18_SYMBOL);
  await pool18Strategy.deployTransaction.wait();
  console.log('Pool 18 strategy deployed to: ', pool18Strategy.address);
  await validateStrategyDeploys();

  // 2. Set boost caps
  console.log('Setting boost caps...');
  const turboBoosterABI = [
    'function setBoostCapForVault(ERC4626 vault, uint256 newBoostCap)',
    'function setBoostCapForCollateral(ERC20 collateral, uint256 newBoostCap)'
  ];
  const turboBoosterContract = new ethers.Contract(addresses.turboBooster, turboBoosterABI, deploySigner);

  // Set pool supply caps
  await turboBoosterContract.setBoostCapForVault(pool8Strategy.address, POOL_8_SUPPLY_CAP);
  console.log('Set pool 8 supply cap');
  await turboBoosterContract.setBoostCapForVault(pool18Strategy.address, POOL_18_SUPPLY_CAP);
  console.log('Set pool 18 supply cap');
  await validateBoostSupplyCaps();

  // 3. Add BAL and gOHM collaterals
  const turboAdminABI = [
    'function addCollateral(address underlying, string calldata name, string calldata symbol, uint256 collateralFactorMantissa, uint256 supplyCap)'
  ];
  const turboAdminContract = new ethers.Contract(addresses.turboAdmin, turboAdminABI, deploySigner);

  // Add BAL and gOHM collaterals
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
