import { TemplatedProposalDescription } from '@custom-types/types';

const deprecate_incentives: TemplatedProposalDescription = {
  title: 'TIP-114: Deprecate TRIBE Incentives system',
  commands: [
    // Harvest staking token wrappers so the ARDs are fully funded
    {
      target: 'stakingTokenWrapperRari',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the FeiRari staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperFOXLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: FOX staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperUMALaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: UMA staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperSYNLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: SYN staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperNEARLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: NEAR staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperMStableLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: MStable staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperPoolTogetherLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: PoolTogether staking token wrapper to fund deposit'
    },
    {
      target: 'd3StakingTokenWrapper',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the FeiRari: d3Pool LP staking token wrapper to fund deposit'
    },
    {
      target: 'fei3CrvStakingtokenWrapper',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the FeiRari: 3crv-FEI metapool LP staking token wrapper to fund deposit'
    },
    {
      target: 'feiDaiStakingTokenWrapper',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the FeiRari: G-UNI DAI/FEI 0.05% fee tier staking token wrapper to fund deposit'
    },
    {
      target: 'feiUsdcStakingTokenWrapper',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the FeiRari: G-UNI USDC/FEI 0.01% fee tier staking token wrapper to fund deposit'
    },

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
      arguments: (addresses) => [addresses.tribe, addresses.core, '200891359701492537313432'],
      description: 'Withdraw 200k TRIBE from 3CRV Votium briber contract to the Core Treasury'
    },
    // Can I harvest everything and then withdraw from the contracts they end up on?

    {
      target: 'tribalChief',
      values: '0',
      method: 'governorWithdrawTribe(uint256)',
      arguments: (addresses) => [
        '10000000000000000000000000' // TODO: Update number with correct figure
      ],
      description: 'Withdraw 10M TRIBE from the Tribal Chief to the Tribal Council timelock'
    },

    /// Transfer claimed TRIBE to the Core Treasury
    {
      target: 'tribe',
      values: '0',
      method: 'transferFrom(address,address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, addresses.core, '16928757542558284368284929'],
      description: 'Transfer previously clawed back TRIBE from TRIBE DAO timelock to the Core Treasury'
    }
  ],
  description: `
  TIP-114: Deprecate TRIBE Incentives system

  Deprecates the TRIBE incentives system according to proposal: 

  Specifically it:
  - Fully funds all remaining auto reward distributors via their staking token wrappers
  - Withdraws remaining TRIBE from the TribalChief, leaving enough behind to fully fund existing commitments
  - Withdraws $50k TRIBE from 3Crv Votium briber contract
  - Withdraws remaining TRIBE from Aave incentives
  - Withdraws remaining TRIBE from ERC20Dripper
  - Moves previously clawed back TRIBE from the TRIBE DAO timelock to the Core Treasury
  `
};

export default deprecate_incentives;
