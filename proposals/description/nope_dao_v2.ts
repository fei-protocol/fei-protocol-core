import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const nope_dao_v2: TemplatedProposalDescription = {
  title: 'TIP-X: NopeDAO V2',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_VETO_ADMIN'), addresses.nopeDAOV1],
      description: 'Revoke POD_VETO_ADMIN from the old NopeDAO and so deprecate it'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_VETO_ADMIN'), addresses.nopeDAO],
      description: 'Grant POD_VETO_ADMIN to the new NopeDAO and so activate it'
    }
  ],
  description: `
  TIP-X: NopeDAO V2
  
  This proposal deploys and activates an upgraded NopeDAO with a modified counting module that prevents
  any votes apart from FOR votes. It also exposes a convenience method to aid in vetoing proposals.

  The old NopeDAO is deprecated.

  Specifically it:
  - Revokes the POD_VETO_ADMIN role from the old NopeDAO
  - Grants the POD_VETO_ADMIN to the new NopeDAO
  `
};

export default nope_dao_v2;
