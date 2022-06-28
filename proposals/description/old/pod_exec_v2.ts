import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const pod_executor_v2: TemplatedProposalDescription = {
  title: 'Pod Executor V2',
  commands: [
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('EXECUTOR_ROLE'), addresses.podExecutorV2],
      description: `
      Tribal Council timelock grants the new Pod Executor v2 contract
      EXECUTOR_ROLE
      `
    },
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('EXECUTOR_ROLE'), addresses.podExecutor],
      description: `
      Migrate Pod Executor contracts

      Tribal Council timelock grants EXECUTOR_ROLE to a new Pod Executor V2 contract
      which exposes executeBatch() as expected.

      It also deprecates the old Pod Executor contract by removing the EXECUTOR_ROLE
      `
    }
  ],
  description: `
  Pod Executor V2
  
  Deploys a Pod Executor V2 which the Tribal Council timelock then authorises 
  with the EXECUTOR role. This exposes the execution of proposal to the public.
  
  In addition, it deprecates the old pod executor by removing the EXECUTOR role.
  `
};

export default pod_executor_v2;
