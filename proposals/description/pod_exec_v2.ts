import { ProposalDescription } from '@custom-types/types';

const pod_executor_v2: ProposalDescription = {
  title: 'Pod Executor V2',
  commands: [
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63', // EXECUTOR_ROLE
        '{newPodExecutor}'
      ],
      description: `
      Tribal Council timelock grants the Pod Executor v2 contract
      EXECUTOR_ROLE
      `
    },
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: [
        '0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63', // EXECUTOR_ROLE
        '{podExecutor}'
      ],
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
  
  Deploys a Pod Executor V2 and has the Tribal Council timelock authorise it 
  with the EXECUTOR role
  `
};

export default pod_executor_v2;
