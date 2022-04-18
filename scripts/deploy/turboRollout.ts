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

