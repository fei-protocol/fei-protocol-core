import { ProposalDescription } from '@custom-types/types';

const fip_52: ProposalDescription = {
  title: 'FIP-52: Increase DAI allocation',
  commands: [
    {
      target: 'daiBondingCurve',
      values: '0',
      method: 'setScale(uint256)',
      arguments: ['150000000000000000000000000'],
      description: 'Set Scale to 150m'
    },
    {
      target: 'daiBondingCurve',
      values: '0',
      method: 'setMintCap(uint256)',
      arguments: ['160000000000000000000000000'],
      description: 'Set Mint Cap to 160m'
    },
    {
      target: 'daiBondingCurve',
      values: '0',
      method: 'setBuffer(uint256)',
      arguments: ['20'],
      description: 'Set Buffer to 20bps'
    }
  ],
  description: `
  Raise DAI bonding curve scale by 50M to 150M, raise cap to 160M, change buffer to 0.2%


  Code: https://github.com/fei-protocol/fei-protocol-core/pull/371
  Discussion: https://tribe.fei.money/t/fip-52-increase-dai-pcv-allocation/3733
`
};

export default fip_52;
