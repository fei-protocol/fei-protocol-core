import { ProposalDescription } from '@custom-types/types';

const fip_76a: ProposalDescription = {
  title: 'FIP-76a: Add LUSD to FeiRari',
  commands: [
    {
      target: 'fuseAdmin',
      values: '0',
      method: 'oracleAdd(address[],address[])',
      arguments: [['{lusd}'], ['{rariChainlinkPriceOracleV3}']],
      description: 'Set oracle for LUSD'
    },
    {
      target: 'fuseAdmin',
      values: '0',
      method: '_deployMarket(address,address,string,string,address,bytes,uint256,uint256,uint256)',
      arguments: [
        '{lusd}', // underlying
        '{rariPool8DaiIrm}', // IRM
        'FeiRari LUSD', // Name
        'fLUSD-8', // Symbol
        '{rariPool8CTokenImpl}', // impl
        '0x', // constructor bytes (not used)
        '0', // reserve factor 0%
        '0', // no admin fee
        '800000000000000000' // LTV 80%
      ],
      description: 'Add LUSD to FeiRari'
    },
    {
      target: 'fuseGuardian',
      values: '0',
      method: '_setMarketSupplyCapsByUnderlying(address[],uint256[])',
      arguments: [['{gUniFeiDaiLP}'], ['10000000000000000000000000000']],
      description: 'Set Fuse supply caps'
    }
  ],
  description: 'OA action to add LUSD to FeiRari. Also raise G-UNI DAI/FEI supply cap 4x in FeiRari.'
};

export default fip_76a;
