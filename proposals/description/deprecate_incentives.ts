import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const deprecate_incentives: TemplatedProposalDescription = {
  title: 'TIP-114: Deprecate TRIBE Incentives system',
  commands: [
    // Withdraw excess TRIBE from reward system
    {
      target: 'erc20Dripper',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.tribe, addresses.core, '2508838570600494412126519'],
      description: 'Withdraw 2.5M TRIBE from the ERC20 Dripper to the Core Treasury'
    },
    {
      target: 'votiumBriber3Crvpool',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.tribe, addresses.core, '1725076846586787179639648'],
      description: `
      Withdraw all TRIBE from 3CRV Votium briber contract to the Core Treasury. 
      
      Withdraw is made up of 200k TRIBE pre-existing on this contract and then an additional 1.5M TRIBE 
      that was harvested from the stakingTokenWrapperBribe3Crvpool.
      `
    },
    {
      target: 'votiumBriberD3pool',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.tribe, addresses.core, '232096077769383622085234'],
      description: `
      Withdraw all TRIBE from D3 Votium briber contract to the Core Treasury. 
      
      Withdraw is made up of 230k TRIBE that was harvested from the stakingTokenWrapperBribeD3pool.
      `
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: '_grantComp(address,uint256)',
      arguments: (addresses) => [addresses.core, '164000000000000000000000'], // TODO: Confirm and get signoff from Storm before
      description: `Withdraw excess 164k TRIBE from Rari delegator contract`
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'governorWithdrawTribe(uint256)',
      arguments: (addresses) => ['26833947775112516867325654'],
      description: `
      Withdraw remaining TRIBE from the Tribal Chief to the Core Treasury. 
      
      Withdrawal amount = 
      (Tribal Chief balance before harvest 
            - (pending rewards, Uniswap-v2 FEI/TRIBE LP + Curve 3crv-FEI metapool LP + G-UNI DAI/FEI 0.05% fee tier)
      
      Withdrawal amount = 27.4M - 0.565M = 26.8M
      `
    },

    ////  Revoke roles from contracts that interacted with Tribal Chief and rewards system
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.optimisticTimelock],
      description: ' Revoke TRIBAL_CHIEF_ADMIN_ROLE from OptimisticTimelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.tribalCouncilTimelock],
      description: ' Revoke TRIBAL_CHIEF_ADMIN_ROLE from Tribal Council timelock'
    },

    //// Transfer the admin of the Aave Tribe Incentives Controller Proxy to Aave governance
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'changeProxyAdmin(address,address)',
      arguments: (addresses) => [addresses.aaveTribeIncentivesController, addresses.aaveLendingPoolAddressesProvider],
      description: `
      Transfer the admin of the Aave Tribe Incentives Controller Proxy to Aave governance, specifically 
      the LendingPoolAddressesProvider.
      `
    }
  ],
  description: `
  TIP-114: Deprecate TRIBE Incentives system

  Deprecates the TRIBE incentives system according to proposal: 

  Specifically it:
  - Withdraws remaining TRIBE from the TribalChief, leaving enough behind to fully fund existing commitments
  - Withdraws all TRIBE from 3Crv and D3 Votium briber contracts
  - Withdraws remaining TRIBE from ERC20 Dripper
  - Revokes no longer needed TRIBAL_CHIEF_ADMIN_ROLE roles
  - Transfers the admin of the Aave Fei Incentives Controller Proxy to Aave Governance
  `
};

export default deprecate_incentives;
