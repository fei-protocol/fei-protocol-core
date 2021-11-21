import { ProposalDescription } from '@custom-types/types';

const fip_37: ProposalDescription = {
  title: 'FIP-37: TRIBE buybacks',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{pcvEquityMinter}'],
      description: 'Make PCV Equity Minter a minter'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{collateralizationOracleKeeper}'],
      description: 'Make CR Oracle Keeper a minter'
    },
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{feiTribeLBPSwapper}', '5000000000000000000000'],
      description: 'Seed LBP Swapper with 5k TRIBE'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0xc307c44629779eb8fc0b85f224c3d22f5876a6c84de0ee42d481eb7814f0d3a8',
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e'
      ],
      description: 'Create ORACLE_ADMIN_ROLE role'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: ['0xc307c44629779eb8fc0b85f224c3d22f5876a6c84de0ee42d481eb7814f0d3a8'],
      description: 'Set ORACLE_ADMIN_ROLE role to admin for CR Oracle'
    },
    {
      target: 'collateralizationOracleWrapper',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: ['0xc307c44629779eb8fc0b85f224c3d22f5876a6c84de0ee42d481eb7814f0d3a8'],
      description: 'Set ORACLE_ADMIN_ROLE role to admin for CR Oracle Wrapper'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0xc307c44629779eb8fc0b85f224c3d22f5876a6c84de0ee42d481eb7814f0d3a8',
        '{collateralizationOracleGuardian}'
      ],
      description: 'Grant Oracle Admin role to Collateralization Oracle Guardian'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816',
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e'
      ],
      description: 'Create SWAP_ADMIN_ROLE'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816', '{pcvEquityMinter}'],
      description: 'Grant SWAP_ADMIN_ROLE to PCVEquityMinter'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0xc307c44629779eb8fc0b85f224c3d22f5876a6c84de0ee42d481eb7814f0d3a8', '{optimisticTimelock}'],
      description: 'Grant ORACLE_ADMIN_ROLE to OA Timelock'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{feiTribeLBPSwapper}', '111000000000000000000000'],
      description: 'Mint 111k FEI to LBP swapper'
    },
    {
      target: 'feiTribeLBPSwapper',
      values: '0',
      method: 'swap()',
      arguments: [],
      description: 'Trigger trial week lbp swapper'
    }
  ],
  description: `

Summary:
Initialize TRIBE buybacks on a continuous weekly basis at 20% APR of protcol equity.

Proposal:
Utilize new contracts to automatically and cyclically trigger auctions of newly minted FEI for TRIBE.
The amount of FEI minted is calculated as 20% of protocol equity normalized to the period length of 1 week per year.

The proposal initializes the collateralization oracle keeper and guardian. The former is used to keep the collateralization oracle up to date, and the latter allows for the guardian to pause and semi-manually override the cached values.

It also seeds 111k FEI and 5k TRIBE for the first auction at a lower value as a capped launch.

Forum discussion: https://tribe.fei.money/t/fip-37-fei-v2-tribe-buybacks/3571
Code: https://github.com/fei-protocol/fei-protocol-core/blob/develop/proposals/description/fip_37.ts
`
};

export default fip_37;
