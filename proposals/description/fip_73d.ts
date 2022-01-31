import { ProposalDescription } from '@custom-types/types';

const fip_73d: ProposalDescription = {
  title: 'FIP-73d: Withdraw BentoBox',
  commands: [
    {
      target: 'bentoBox',
      values: '0',
      method: 'withdraw(address,address,address,uint256,uint256)',
      arguments: ['{fei}', '{optimisticTimelock}', '{optimisticTimelock}', '8151516160938636724790190', '0'],
      description: 'Withdraw FEI from BentoBox'
    }
  ],
  description: ``
};

export default fip_73d;
