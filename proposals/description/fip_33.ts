import { ProposalDescription } from '@custom-types/types';

const fip_33: ProposalDescription = {
  title: 'FIP-33: Balancer Treasury Swap',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{tribeBalOtcEscrow}', '2598000000000000000000000'],
      description: 'Allocate TRIBE to otc escrow'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{feiBalOtcEscrow}', '2454000000000000000000000'],
      description: 'Mint FEI to otc escrow'
    },
    {
      target: 'tribeBalOtcEscrow',
      values: '0',
      method: 'swap()',
      arguments: [],
      description: 'Swap TRIBE OTC'
    },
    {
      target: 'feiBalOtcEscrow',
      values: '0',
      method: 'swap()',
      arguments: [],
      description: 'Swap FEI OTC'
    }
  ],
  description: `

Summary:

`
};

export default fip_33;
