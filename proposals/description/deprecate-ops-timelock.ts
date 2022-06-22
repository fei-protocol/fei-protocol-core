import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const deprecate_ops_timelock: TemplatedProposalDescription = {
  title: 'Deprecate Ops Timelock',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), addresses.opsOptimisticTimelock],
      description: 'Revoke METAGOVERNANCE_VOTE_ADMIN role from the Ops Optimistic Timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), addresses.opsOptimisticTimelock],
      description: 'Revoke METAGOVERNANCE_TOKEN_STAKING role from the Ops Optimistic Timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('ORACLE_ADMIN_ROLE'), addresses.opsOptimisticTimelock],
      description: 'Revoke ORACLE_ADMIN_ROLE role from the Ops Optimistic Timelock'
    }
  ],
  description: `
  Deprecate the Ops optimistic timelock.

  Specifically, revoke METAGOVERNANCE_TOKEN_STAKING, METAGOVERNANCE_VOTE_ADMIN and METAGOVERNANCE_TOKEN_STAKING roles
  from the timelock.
  `
};

export default deprecate_ops_timelock;
