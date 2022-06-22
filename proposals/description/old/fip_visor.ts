import { ProposalDescription } from '@custom-types/types';

const fip_visor: ProposalDescription = {
  title: 'Visor redemption',
  commands: [
    {
      target: 'hypervisor',
      values: '0',
      method: 'withdraw(uint256,address,address)',
      arguments: ['2001591300857', '{optimisticTimelock}', '{optimisticTimelock}'],
      description: 'Withdraw from visor'
    }
  ],
  description: ``
};

export default fip_visor;
