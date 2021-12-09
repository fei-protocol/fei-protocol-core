import { ProposalDescription } from '@custom-types/types';

const merger: ProposalDescription = {
  title: 'FIP-51: FeiRari Merger',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{pegExchanger}', '270000000000000000000000000'],
      description: 'Seed Peg Exchanger with 270m TRIBE'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{tribeRagequit}'],
      description: 'Grant Tribe Ragequit Minter'
    },
    {
      target: 'pegExchanger',
      values: '0',
      method: 'tribeAccept()',
      arguments: [],
      description: 'Tribe Accept PegExchanger'
    },
    {
      target: 'tribeRagequit',
      values: '0',
      method: 'tribeAccept()',
      arguments: [],
      description: 'Tribe Accept TribeRageQuit'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: [
        '{gfxAddress}',
        '100' // TODO calculate amount
      ],
      description: 'Tribe Accept TribeRageQuit'
    }
  ],
  description: `
  Code: 
`
};

export default merger;
