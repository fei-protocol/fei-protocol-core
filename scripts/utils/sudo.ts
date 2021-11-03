import hre, { network, ethers } from 'hardhat';
import { forceEth } from '../../test/integration/setup/utils';
import { NamedContracts } from '../../types/types';

import * as dotenv from 'dotenv';

dotenv.config();

// Grants Governor, Minter, Burner, and PCVController access to accounts[0]
// Also mints a large amount of FEI to accounts[0]
export async function sudo(contracts: NamedContracts, logging = false): Promise<void> {
  const core = contracts.core;
  const fei = contracts.fei;
  const timelock = contracts.feiDAOTimelock;

  // Impersonate the Timelock which has Governor access on-chain
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelock.address]
  });

  const accounts = await ethers.getSigners();

  // Force ETH to the Timelock to send txs on its behalf
  logging ? console.log('Forcing ETH to timelock') : undefined;
  await forceEth(timelock.address);

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelock.address]
  });

  const timelockSigner = await ethers.getSigner(timelock.address);

  // Use timelock to grant access
  logging ? console.log('Granting roles to accounts[0]') : undefined;
  await core.connect(timelockSigner).grantGovernor(accounts[0].address);

  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [timelock.address]
  });

  await core.grantPCVController(accounts[0].address);
  await core.grantMinter(accounts[0].address);
  await core.grantBurner(accounts[0].address);

  logging ? console.log('Minting FEI to accounts[0]') : undefined;
  await fei.mint(accounts[0].address, '10000000000000000000000000');
}
