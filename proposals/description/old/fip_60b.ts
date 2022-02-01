import { ProposalDescription } from '@custom-types/types';

const fip_60b: ProposalDescription = {
  title: 'FIP-60b: FeiRari Rewards Upgrade',
  commands: [
    {
      target: 'rariPool8Comptroller',
      values: '0',
      method: '_setPendingAdmin(address)',
      arguments: ['{fuseAdmin}'],
      description: 'Set pending admin on comptroller'
    },
    {
      target: 'fuseAdmin',
      values: '0',
      method: '_acceptAdmin()',
      arguments: [],
      description: 'accept admin'
    },
    {
      target: 'rariPool8MasterOracle',
      values: '0',
      method: 'changeAdmin(address)',
      arguments: ['{fuseAdmin}'],
      description: 'set oracle admin'
    },
    {
      target: 'fuseAdmin',
      values: '0',
      method: 'oracleAdd(address[],address[])',
      arguments: [['{gUniFeiUsdcLP}'], ['{gUniFuseOracle}']],
      description: 'set oracle for G-UNI FEI-USDC'
    },
    {
      target: 'fuseAdmin',
      values: '0',
      method: '_deployMarket(address,address,string,string,address,bytes,uint256,uint256,uint256)',
      arguments: [
        '{gUniFeiDaiLP}', // underlying
        '{rariPool8EthIrm}', // IRM (not used)
        'FeiRari G-UNI FEI-DAI Fuse', // Name
        'fG-UNI-FEI-DAI-8', // Symbol
        '{rariPool8CTokenImpl}', // impl
        '0x', // constructor bytes (not used)
        '0', // reserve factor (not used)
        '0', // admin fee (not used)
        '600000000000000000' // LTV scaled by 1e18
      ],
      description: 'Add FEI-DAI to FeiRari'
    },
    {
      target: 'fuseAdmin',
      values: '0',
      method: '_deployMarket(address,address,string,string,address,bytes,uint256,uint256,uint256)',
      arguments: [
        '{gUniFeiUsdcLP}', // underlying
        '{rariPool8EthIrm}', // IRM (not used)
        'FeiRari G-UNI FEI-USDC Fuse', // Name
        'fG-UNI-FEI-USDC-8', // Symbol
        '{rariPool8CTokenImpl}', // impl
        '0x', // constructor bytes (not used)
        '0', // reserve factor (not used)
        '0', // admin fee (not used)
        '600000000000000000' // LTV scaled by 1e18
      ],
      description: 'Add FEI-USDC to FeiRari'
    },
    {
      target: 'fuseGuardian',
      values: '0',
      method: '_setBorrowPausedByUnderlying(address,bool)',
      arguments: ['{gUniFeiDaiLP}', true],
      description: 'Set FEI-DAI borrow paused'
    },
    {
      target: 'fuseGuardian',
      values: '0',
      method: '_setBorrowPausedByUnderlying(address,bool)',
      arguments: ['{gUniFeiUsdcLP}', true],
      description: 'Set FEI-USDC borrow paused'
    },
    {
      target: 'fuseGuardian',
      values: '0',
      method: '_setMarketSupplyCapsByUnderlying(address[],uint256[])',
      arguments: [
        ['{gUniFeiDaiLP}', '{gUniFeiUsdcLP}'],
        ['2500000000000000000000000000', '50000000000000000000000']
      ],
      description: 'Set Fuse supply caps'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'add(uint120,address,address,(uint128,uint128)[])',
      arguments: [
        '100', // allocation points
        '{feiDaiStakingTokenWrapper}', // underlying
        '0x0000000000000000000000000000000000000000', // IRewarder bonus rewarder (not used)
        [[0, 10000]] // default lock period + reward multiplier
      ],
      description: 'Add FEI-DAI to TribalChief'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'add(uint120,address,address,(uint128,uint128)[])',
      arguments: ['250', '{feiUsdcStakingTokenWrapper}', '0x0000000000000000000000000000000000000000', [[0, 10000]]],
      description: 'Add FEI-USDC to TribalChief'
    },
    {
      target: 'feiDaiStakingTokenWrapper',
      values: '0',
      method: 'init(uint256)',
      arguments: [15],
      description: 'Init FEI-DAI STW'
    },
    {
      target: 'feiUsdcStakingTokenWrapper',
      values: '0',
      method: 'init(uint256)',
      arguments: [16],
      description: 'Init FEI-USDC STW'
    },
    {
      target: 'feiDaiAutoRewardsDistributor',
      values: '0',
      method: 'init()',
      arguments: [],
      description: 'Init FEI-DAI AutoRewardsDistributor'
    },
    {
      target: 'feiUsdcAutoRewardsDistributor',
      values: '0',
      method: 'init()',
      arguments: [],
      description: 'Init FEI-USDC AutoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb',
        '{feiDaiAutoRewardsDistributor}'
      ],
      description: 'Grant ARD role to FEI-DAI AutoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb',
        '{feiUsdcAutoRewardsDistributor}'
      ],
      description: 'Grant ARD role to FEI-USDC AutoRewardsDistributor'
    }
  ],
  description: ``
};

export default fip_60b;
