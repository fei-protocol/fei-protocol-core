import { ProposalDescription } from '@custom-types/types';

const permanently_revoke_burner: ProposalDescription = {
  title: 'FIP-54: Permanently Revoke Burner, FIP-63: Rari Infra Funding, Maintenance',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'setCore(address)',
      arguments: ['{restrictedPermissions}'],
      description: 'Set restricted permissions to core for Fei contract'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{ethPSMFeiSkimmer}'],
      description: 'Grant PCV Controller to ETH PSM Skimmer'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{daiPSMFeiSkimmer}'],
      description: 'Grant PCV Controller to DAI PSM Skimmer'
    },
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{rariInfraTribeTimelock}', '4000000000000000000000000'],
      description: 'Send 4M TRIBE to Rari Infra TRIBE Timelock'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{rariInfraFeiTimelock}', '4000000000000000000000000'],
      description: 'Send 4M FEI to Rari Infra FEI Timelock'
    },
    {
      target: 'votiumBriberD3pool',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: ['0x2d46c62aa6fbc9b550f22e00476aebb90f4ea69cd492a68db4d444217763330d'], // keccak256("VOTIUM_ADMIN_ROLE")
      description: 'Set Votium Briber Admin'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x2d46c62aa6fbc9b550f22e00476aebb90f4ea69cd492a68db4d444217763330d',
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e'
      ],
      description: 'Create Votium Briber Admin Role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x2d46c62aa6fbc9b550f22e00476aebb90f4ea69cd492a68db4d444217763330d', '{opsOptimisticTimelock}'],
      description: 'Grant Votium Briber Admin Role'
    }
  ],
  description: `
  FIP-54: Replace the core reference in the FEI token to a “Restricted Permissions” which only allows for minting and pausing. 
  This would permanently lock the contract’s ability to burn from any address. It preserves the ability for a user or contract to burn its own FEI.

  FIP-63: Fund Rari Infrastructure with 4M FEI and 4M TRIBE over 2 years with clawback

  Maintenance: 
  1. Add an ops optimistic timelock with 24h delay for votium bribes and DAO grants
  2. Add Fei Skimmers for both PSMs to burn surplus FEI

  Code: https://github.com/fei-protocol/fei-protocol-core/pull/458
  Discussion: https://tribe.fei.money/t/fip-54-permanently-deprecate-burner/3743, https://tribe.fei.money/t/fip-63-infrastructure-team-funding/3855 
`
};

export default permanently_revoke_burner;
