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

    //////////////    Configure Membership of Council and Pod /////////////
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
      description: 'Add designated members to the Tribal Council'
    },
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
      description: 'Remove placeholder members from Tribal Council'
    },
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
      description: 'Add designated members to the Protocol Pod'
    },
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
    {
      target: 'podController',
      values: '0',
      method: 'updatePodAdmin(uint256,address)',
      arguments: [
        '14', // TODO: Replace with real protocol pod ID
        '{tribalCouncilTimelock}'
      ],
      description: `
      Update the podAdmin of the protocol pod to the tribalCouncilTimelock.
      This replaces the default deploy address, which was used for 
      convenience in creating the pod from the factory.
      `
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
