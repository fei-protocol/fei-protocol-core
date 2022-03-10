import { ProposalDescription } from '@custom-types/types';

// TODO: Need to be able to inject podIds into here ideally. For now they're hardcoded
const fip_82: ProposalDescription = {
  title: 'FIP-82: Deploy TribalCouncil',
  commands: [
    //////////// GRANT POD TIMELOCKS RELEVANT ACCESS ROLES ///////////
    // Create ROLE_ADMIN role
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096', // ROLE_ADMIN
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e' // GOVERN_ROLE
      ],
      description: 'Create ROLE_ADMIN role'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0xa8d944a5277d6a203f114d020d26918a390f167b089a46be4fca9da716d23783', // ORACLE_ADMIN
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e' // GOVERN_ROLE
      ],
      description: 'Create ORACLE_ADMIN role'
    },
    // Grant TribalCouncil timelock ROLE_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096', '{tribalCouncilTimelock}'],
      description: 'Grant Tribal Council ROLE_ADMIN'
    },
    // Grant protocolPod timelock ORACLE_ADMIN role
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0xa8d944a5277d6a203f114d020d26918a390f167b089a46be4fca9da716d23783', '{protocolPodTimelock}'],
      description: 'Grant Protocol Pod ORACLE_ADMIN role'
    },

    //////////////    Configure Membership of Council and Pod /////////////
    // Add members to the Tribal Council
    {
      target: 'memberToken',
      values: '0',
      method: 'mintSingleBatch(address[] memory,uint256,bytes)',
      arguments: [
        [
          '0x000000000000000000000000000000000000000D', // TODO: Complete with real member addresses
          '0x000000000000000000000000000000000000000E',
          '0x000000000000000000000000000000000000000F',
          '0x0000000000000000000000000000000000000010',
          '0x0000000000000000000000000000000000000011',
          '0x0000000000000000000000000000000000000012',
          '0x0000000000000000000000000000000000000013',
          '0x0000000000000000000000000000000000000014',
          '0x0000000000000000000000000000000000000015'
        ],
        '13', // TODO: Replace hardcoded value with real podId
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      ],
      description: 'Add member to the Tribal Council'
    },
    // Remove initial placeholders members from the Tribal Council
    {
      target: 'memberToken',
      values: '0',
      method: 'burnSingleBatch(address[] memory,uint256)',
      arguments: [
        [
          '0x0000000000000000000000000000000000000004',
          '0x0000000000000000000000000000000000000005',
          '0x0000000000000000000000000000000000000006',
          '0x0000000000000000000000000000000000000007',
          '0x0000000000000000000000000000000000000008',
          '0x0000000000000000000000000000000000000009',
          '0x000000000000000000000000000000000000000A',
          '0x000000000000000000000000000000000000000B',
          '0x000000000000000000000000000000000000000C'
        ],
        '13' // TODO: Replace hardcoded value with real podId
      ],
      description: 'Burn placeholder deploy members from Tribal Council'
    },
    // Add members to the Protocol Pod
    {
      target: 'memberToken',
      values: '0',
      method: 'mintSingleBatch(address[] memory,uint256,bytes)',
      arguments: [
        [
          '0x0000000000000000000000000000000000000009', // TODO: Complete with real member addresses
          '0x000000000000000000000000000000000000000A',
          '0x000000000000000000000000000000000000000B',
          '0x000000000000000000000000000000000000000C',
          '0x000000000000000000000000000000000000000D'
        ],
        '14', // TODO: Replace with real protocol pod ID
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      ],
      description: 'Add members to the Protocol Pod'
    },
    // Remove initial placeholder members from Protocol Pod
    {
      target: 'memberToken',
      values: '0',
      method: 'burnSingleBatch(address[] memory,uint256)',
      arguments: [
        [
          '0x0000000000000000000000000000000000000004',
          '0x0000000000000000000000000000000000000005',
          '0x0000000000000000000000000000000000000006',
          '0x0000000000000000000000000000000000000007',
          '0x0000000000000000000000000000000000000008'
        ],
        '14' // TODO: Replace with real protocol pod ID
      ],
      description: 'Remove initial placeholder members from Protocol Pod'
    },
    // Update PodAdmin for protocol tier pods to be the TribalCouncil timelock
    // TODO: Think need to handle that different pods might have different admins?
    {
      target: 'podController',
      values: '0',
      method: 'updatePodAdmin(uint256,address)',
      arguments: [
        '14', // TODO: Replace with real protocol pod ID
        '{tribalCouncilTimelock}'
      ],
      description: 'Remove initial placeholder members from Protocol Pod'
    }
  ],
  description: `
  FIP-82a enacts the first stage of the governance upgrade to the TRIBE DAO
  Specifically, this FIP will:
  1. Transition PodAdmins to correct podAdmins
  2. Grant relevant pod timelocks access roles
  3. Configure memberships of the Tribal Council and Protocol Pod as according to 
     that previously decided
  `
};

export default fip_82;
