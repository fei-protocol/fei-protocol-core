import { ProposalDescription } from '@custom-types/types';

const permanently_revoke_burner: ProposalDescription = {
  title: 'Permanently Revoke Burner',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'setCore(address)',
      arguments: ['{restrictedPermissions}'],
      description: 'Set restricted permissions to core for Fei contract'
    }
  ],
  description: 'Permanently Revoke Burner'
};

export default permanently_revoke_burner;
