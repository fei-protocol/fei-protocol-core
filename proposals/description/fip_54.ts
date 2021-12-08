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
  description: `
  Replace the core reference in the FEI token to a “Restricted Permissions” which only allows for minting and pausing. 
  This would permanently lock the contract’s ability to burn from any address. It preserves the ability for a user or contract to burn its own FEI.

  Code: https://github.com/fei-protocol/fei-protocol-core/pull/352
  Discussion: https://tribe.fei.money/t/fip-54-permanently-deprecate-burner/3743 
`
};

export default permanently_revoke_burner;
