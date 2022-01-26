import { ProposalDescription } from '@custom-types/types';

const fip_60: ProposalDescription = {
  title: 'FIP-60: FeiRari Rewards Upgrade',
  commands: [
    {
      target: 'rariPool8Comptroller',
      values: '0',
      method: '_setPriceOracle(address)',
      arguments: ['{rariPool8MasterOracle}'],
      description: 'Set oracle to new Master Oracle'
    },
    {
      target: 'rariPool8Comptroller',
      values: '0',
      method: '_deployMarket(bool,bytes,uint256)',
      arguments: [
        false,
        '0x000000000000000000000000baaa1f5dba42c3389bdbc2c9d2de134f5cd0dc89000000000000000000000000c54172e34046c1653d1920d40333dd358c7a1af4000000000000000000000000bab47e4b692195bf064923178a90ef999a15f8190000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000016000000000000000000000000067db14e73c2dce786b5bbbfa4d010deab4bbfcf900000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001346656952617269206433706f6f6c20467573650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000056644332d380000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        '600000000000000000'
      ],
      description: 'Add d3 to FeiRari'
    },
    {
      target: 'rariPool8Comptroller',
      values: '0',
      method: '_deployMarket(bool,bytes,uint256)',
      arguments: [
        false,
        '0x00000000000000000000000006cb22615ba53e60d67bf6c341a0fd5e718e1655000000000000000000000000c54172e34046c1653d1920d40333dd358c7a1af4000000000000000000000000bab47e4b692195bf064923178a90ef999a15f8190000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000016000000000000000000000000067db14e73c2dce786b5bbbfa4d010deab4bbfcf900000000000000000000000000000000000000000000000000000000000001a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001f46656952617269204645492d33437276204d6574616d706f6f6c204675736500000000000000000000000000000000000000000000000000000000000000000b664645492d334372762d380000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        '600000000000000000'
      ],
      description: 'Add FEI-3Crv to FeiRari'
    },
    {
      target: 'rariPool8Comptroller',
      values: '0',
      method: '_setPauseGuardian(address)',
      arguments: ['{fuseGuardian}'],
      description: 'Set Fuse pause guardian'
    },
    {
      target: 'fuseGuardian',
      values: '0',
      method: '_setBorrowPausedByUnderlying(address,bool)',
      arguments: ['{curveD3pool}', true],
      description: 'Set d3 borrow paused'
    },
    {
      target: 'fuseGuardian',
      values: '0',
      method: '_setBorrowPausedByUnderlying(address,bool)',
      arguments: ['{curve3Metapool}', true],
      description: 'Set Fei-3Crv borrow paused'
    },
    {
      target: 'rariPool8Comptroller',
      values: '0',
      method: '_setBorrowCapGuardian(address)',
      arguments: ['{fuseGuardian}'],
      description: 'Set Fuse borrow cap guardian'
    },
    {
      target: 'fuseGuardian',
      values: '0',
      method: '_setMarketSupplyCapsByUnderlying(address[],uint256[])',
      arguments: [
        ['{curveD3pool}', '{curve3Metapool}'],
        ['25000000000000000000000000', '25000000000000000000000000']
      ],
      description: 'Set Fuse supply caps'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'add(uint120,address,address,(uint128,uint128)[])',
      arguments: [
        '250', // allocation points
        '{d3StakingTokenWrapper}', // underlying
        '0x0000000000000000000000000000000000000000', // IRewarder bonus rewarder (not used)
        [[0, 10000]] // default lock period + reward multiplier
      ],
      description: 'Add d3 to TribalChief'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'add(uint120,address,address,(uint128,uint128)[])',
      arguments: ['250', '{fei3CrvStakingtokenWrapper}', '0x0000000000000000000000000000000000000000', [[0, 10000]]],
      description: 'Add FEI-3Crv to TribalChief'
    },
    {
      target: 'd3StakingTokenWrapper',
      values: '0',
      method: 'init(uint256)',
      arguments: [13],
      description: 'Init d3 STW'
    },
    {
      target: 'fei3CrvStakingtokenWrapper',
      values: '0',
      method: 'init(uint256)',
      arguments: [14],
      description: 'Init FEI-3Crv STW'
    },
    {
      target: 'd3AutoRewardsDistributor',
      values: '0',
      method: 'init()',
      arguments: [],
      description: 'Init d3 AutoRewardsDistributor'
    },
    {
      target: 'fei3CrvAutoRewardsDistributor',
      values: '0',
      method: 'init()',
      arguments: [],
      description: 'Init FEI-3Crv AutoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'becomeAdmin()',
      arguments: [],
      description: 'Become RewardsDistributorAdmin admin'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb', '{d3AutoRewardsDistributor}'],
      description: 'Grant ARD role to d3 AutoRewardsDistributor'
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x19cca239eaee0f28c6ba4c8c860332b8a23b35008b89b0507b96138ca5691cbb',
        '{fei3CrvAutoRewardsDistributor}'
      ],
      description: 'Grant ARD role to FEI-3Crv AutoRewardsDistributor'
    }
  ],
  description: ``
};

export default fip_60;
