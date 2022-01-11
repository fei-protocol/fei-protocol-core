import { ProposalDescription } from '@custom-types/types';

const fip_60b: ProposalDescription = {
  title: 'FIP-60b: FeiRari Rewards Upgrade',
  commands: [
    {
      target: 'fuseAdmin',
      values: '0',
      method: '_deployMarket(address,address,string,string,address,bytes,uint256,uint256,uint256)',
      arguments: [
        '{wstEth}', // underlying
        '{rariPool8EthIrm}', // IRM (not used)
        'FeiRari Wrapped stETH Fuse', // Name
        'fwstETH-8', // Symbol
        '{rariPool8CTokenImpl}', // impl
        '0x', // constructor bytes (not used)
        '0', // reserve factor (not used)
        '0', // admin fee (not used)
        '800000000000000000' // LTV scaled by 1e18
      ],
      description: 'Add wstETH to FeiRari'
    },
    {
      target: 'fuseGuardian',
      values: '0',
      method: '_setBorrowPausedByUnderlying(address,bool)',
      arguments: ['{wstEth}', true],
      description: 'Set wstETH borrow paused'
    },
    {
      target: 'fuseGuardian',
      values: '0',
      method: '_setMarketSupplyCapsByUnderlying(address[],uint256[])',
      arguments: [
        ['{curveD3pool}', '{curve3Metapool}', '{wstEth}', '{gUniFeiUsdcLP}'],
        [
          '100000000000000000000000000',
          '100000000000000000000000000',
          '30000000000000000000000',
          '200000000000000000000000'
        ]
      ],
      description: 'Set Fuse supply caps'
    }
  ],
  description: ``
};

export default fip_60b;
