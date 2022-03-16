import { ProposalDescription } from '@custom-types/types';

const fip_82: ProposalDescription = {
  title: 'FIP-82: Deploy TribalCouncil',
  commands: [
    //////////// GRANT POD TIMELOCKS RELEVANT ACCESS ROLES ///////////
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
        '0x1c4afb10045e2ffba702b04df46e551f6f2c584499b4abe7b6136efe6b05a34d', // POD_DEPLOYER_ROLE
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e' // GOVERN_ROLE
      ],
      description: 'Create POD_DEPLOYER_ROLE role'
    },
    // TODO: Update to Votium role
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
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096', '{tribalCouncilTimelock}'],
      description: 'Grant Tribal Council ROLE_ADMIN'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x1c4afb10045e2ffba702b04df46e551f6f2c584499b4abe7b6136efe6b05a34d', '{tribalCouncilTimelock}'],
      description: 'Grant POD_DEPLOYER_ROLE to TribalCouncil timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x1c4afb10045e2ffba702b04df46e551f6f2c584499b4abe7b6136efe6b05a34d', '{protocolPodTimelock}'],
      description: 'Grant POD_DEPLOYER_ROLE to Protocol pod timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0xa8d944a5277d6a203f114d020d26918a390f167b089a46be4fca9da716d23783', '{protocolPodTimelock}'],
      description: 'Grant Protocol Pod ORACLE_ADMIN role'
    },
    /////// Grant appropriate Tribe Roles admin priviledges over Tribal Council /////
    {
      target: 'podAdminGateway',
      values: '0',
      method: 'batchGrantAdminPriviledge(uint256[] memory,uint8[] memory,bytes32[] memory)',
      arguments: [
        ['13', '13', '13'], // TODO: Replace with real protocol pod ID
        ['0', '1', '1'], // ADD_MEMBER, REMOVE_MEMBER, ADD_MEMBER
        [
          '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e', // GOVERNOR (able to add member)
          '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e', // GOVERNOR (able to remove member)
          '0x55435dd261a4b9b3364963f7738a7a662ad9c84396d64be3365284bb7f0a5041' // GUARDIAN (able to remove member)
        ]
      ],
      description: `
      Grant GOVERNOR ability to add members to TribalCouncil. 
      Grant GOVERNOR and GUARDIAN ability to remove members from TribalCouncil
      `
    },
    /////// Grant appropriate Tribe Roles admin priviledges over Protocol tier pod /////
    {
      target: 'podAdminGateway',
      values: '0',
      method: 'batchGrantAdminPriviledge(uint256[] memory,uint8[] memory,bytes32[] memory)',
      arguments: [
        ['14', '14', '14', '14', '14'],
        ['0', '1', '0', '1', '1'], // ADD_MEMBER, REMOVE_MEMBER, ADD_MEMBER, REMOVE_MEMBER, REMOVE_MEMBER
        [
          '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e', // GOVERNOR (able to add member)
          '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e', // GOVERNOR (able to remove member)
          '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096', // ROLE_ADMIN (able to add member)
          '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096', // ROLE_ADMIN (able to remove member)
          '0x55435dd261a4b9b3364963f7738a7a662ad9c84396d64be3365284bb7f0a5041' // GUARDIAN (able to remove member)
        ]
      ],
      description: `
      Grant GOVERNOR ability to add members to TribalCouncil. 
      Grant GOVERNOR and GUARDIAN ability to remove members from TribalCouncil
      `
    },
    //////////////    Configure Membership of Council and Pod /////////////
    // TODO: Replace with calls to podAdminGateway
    {
      target: 'podAdminGateway',
      values: '0',
      method: 'batchAddMemberToPod(uint256 _podId,address[] memory _members)',
      arguments: [
        '13',
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
        ]
      ],
      description: 'Add designated members to the Tribal Council'
    },
    {
      target: 'podAdminGateway',
      values: '0',
      method: 'batchRemoveMemberFromPod(uint256 _podId, address[] memory)',
      arguments: [
        '13', // TODO: Replace hardcoded value with real podId
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
        ]
      ],
      description: 'Remove placeholder members from Tribal Council'
    },
    {
      target: 'podAdminGateway',
      values: '0',
      method: 'batchAddMemberToPod(uint256 _podId,address[] memory _members)',
      arguments: [
        '14', // TODO: Replace with real protocol pod ID
        [
          '0x0000000000000000000000000000000000000009', // TODO: Complete with real member addresses
          '0x000000000000000000000000000000000000000A',
          '0x000000000000000000000000000000000000000B',
          '0x000000000000000000000000000000000000000C',
          '0x000000000000000000000000000000000000000D'
        ]
      ],
      description: 'Add designated members to the Protocol Pod'
    },
    {
      target: 'podAdminGateway',
      values: '0',
      method: 'batchRemoveMemberFromPod(uint256 _podId, address[] memory)',
      arguments: [
        '14', // TODO: Replace with real protocol pod ID
        [
          '0x0000000000000000000000000000000000000004',
          '0x0000000000000000000000000000000000000005',
          '0x0000000000000000000000000000000000000006',
          '0x0000000000000000000000000000000000000007',
          '0x0000000000000000000000000000000000000008'
        ]
      ],
      description: 'Remove initial placeholder members from Protocol Pod'
    }
  ],
  description: `
  FIP-82 enacts the governance upgrade to the TRIBE DAO. Specifically, this FIP will:
  1. Create roles for the Tribal Council and Protocol Pod
  2. Grant those roles to the Tribal Council and first Protocol pod timelocks
  3. Initialise the membership of the Tribal Council and protocol pod, as previously decided on in snapshot
  4. Update the admin of the protocol pod to the Tribal Council timelock

  Snapshot vote: https://snapshot.fei.money/#/proposal/0x463fd1be98d9e86c83eb845ca7e2a5555387e3c86ca0b756aada17a11df87f2b
  Forum post discussion: https://tribe.fei.money/t/fip-82-governance-enhancements/3945
  `
};

export default fip_82;
