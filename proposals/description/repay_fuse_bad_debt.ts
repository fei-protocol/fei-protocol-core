import { TemplatedProposalDescription } from '@custom-types/types';

const fip_x: TemplatedProposalDescription = {
  title: 'Repay Fuse Bad Debt',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: (addresses) => [addresses.fuseFixer],
      description: 'Set FuseFixer as a safe address'
    }
  ],
  description: 'Set FuseFixer as a safe address'
};

export default fip_x;
