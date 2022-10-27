import hre, { network, ethers } from 'hardhat';
import { forceEth } from '../../test/integration/setup/utils';
import { NamedContracts } from '../../types/types';

import * as dotenv from 'dotenv';

dotenv.config();

// Grants Governor, Minter, Burner, and PCVController access to accounts[0]
// Also mints a large amount of FEI to accounts[0]
export async function sudo(contracts: NamedContracts, logging = false): Promise<void> {
  const timelock = contracts.feiDAOTimelock;

  // Impersonate the Timelock which has Governor access on-chain
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelock.address]
  });

  // Force ETH to the Timelock to send txs on its behalf
  logging ? console.log('Forcing ETH to timelock') : undefined;
  await forceEth(timelock.address);

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelock.address]
  });
}
