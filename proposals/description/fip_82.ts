import { ProposalDescription } from '@custom-types/types';

const fip_82: ProposalDescription = {
  title: 'FIP-82: Deploy TribalCouncil',
  commands: [
    //////////// Create relevant TribeRoles and transfer admin of relevant roles to ROLE_ADMIN ///////////
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
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096', // ROLE_ADMIN
        '{feiDAOTimelock}' // Fei DAI timelock
      ],
      description: `
      Grant FEI DAO timelock ROLE_ADMIN, so it is able to manage roles and grant roles that are managed
      by this role.`
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x1c4afb10045e2ffba702b04df46e551f6f2c584499b4abe7b6136efe6b05a34d', // POD_DEPLOYER_ROLE
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Create POD_DEPLOYER_ROLE role'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x29af6c210963c1cf458c6a5bf082996cf54b23ebba0c0fb8ae110e8e43371c71', // POD_VETO_ADMIN
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: `
      Create POD_VETO_ADMIN role. Assign ROLE_ADMIN as admin
      `
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0xf62a46a499242191aaab61084d4912c2c0a8c48e3d70edfb5a9be2bc9e92622f', // POD_METADATA_REGISTER_ROLE
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: `
      Create POD_METADATA_REGISTER_ROLE role, assign ROLE_ADMIN as admin
      `
    },
    //////////////// Grant relevant TribeRoles to relevant timelock and safe contracts ///////////////
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096', '{tribalCouncilTimelock}'],
      description: `
      Grant Tribal Council timelock the ROLE_ADMIN role. TribalCouncil will be able to manage Admin level roles
      and below
      `
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      // Admin of POD_VETO_ADMIN role is ROLE_ADMIN. ROLE_ADMIN is granted to GOVERNOR
      arguments: ['0x29af6c210963c1cf458c6a5bf082996cf54b23ebba0c0fb8ae110e8e43371c71', '{tribalCouncilTimelock}'],
      description: `
      Grant POD_VETO_ADMIN to TribalCouncil timelock. TribalCouncil will be able grant or revoke other TribeRoles
      from having veto permissions over pods
      `
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x1c4afb10045e2ffba702b04df46e551f6f2c584499b4abe7b6136efe6b05a34d', '{tribalCouncilTimelock}'],
      description: 'Grant POD_DEPLOYER_ROLE to TribalCouncil timelock. TribalCouncil will be able to deploy pods'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x1c4afb10045e2ffba702b04df46e551f6f2c584499b4abe7b6136efe6b05a34d', '{feiDAOTimelock}'],
      description: 'Grant POD_DEPLOYER_ROLE to FeiDAO timelock. FeiDAO will be able to create and deploy pods'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x2d46c62aa6fbc9b550f22e00476aebb90f4ea69cd492a68db4d444217763330d', '{protocolPodTimelock}'],
      description: 'Grant Protocol Pod VOTIUM_ADMIN_ROLE role. Protocol pod will be able to manage Votium bribes'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0xf62a46a499242191aaab61084d4912c2c0a8c48e3d70edfb5a9be2bc9e92622f', '{tribalCouncilSafe}'],
      description: 'Grant TribalCouncil Gnosis Safe address role to register metadata'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0xf62a46a499242191aaab61084d4912c2c0a8c48e3d70edfb5a9be2bc9e92622f', '{protocolPodSafe}'],
      description: 'Grant ProtocolPod Gnosis Safe address role to register metadata'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x2d46c62aa6fbc9b550f22e00476aebb90f4ea69cd492a68db4d444217763330d', // VOTIUM_ADMIN_ROLE
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Transfer VOTIUM_ADMIN_ROLE admin from GOVERNOR to ROLE_ADMIN'
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
        '17', // TODO: Replace hardcoded value with real podId
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
        '17' // TODO: Replace hardcoded value with real podId
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
        '18', // TODO: Replace with real protocol pod ID
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
        '18' // TODO: Replace with real protocol pod ID
      ],
      description: 'Remove initial placeholder members from Protocol Pod'
    },
    {
      target: 'podController',
      values: '0',
      method: 'updatePodAdmin(uint256,address)',
      arguments: [
        '18', // TODO: Replace with real protocol pod ID
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
