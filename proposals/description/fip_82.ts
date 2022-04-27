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
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x6ecc8dff15d98038e3ff32bfe76768123628cfdd2c3d11f2ec23c5433a9d4ba3', // POD_ADMIN
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Create POD_ADMIN role'
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
    //////////////// Grant relevant TribeRoles to relevant Timelocks, Safes, Bastion and NopeDAO ///////////////
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096', // ROLE_ADMIN
        '{feiDAOTimelock}' // Fei DAO timelock
      ],
      description: `
      Grant FEI DAO timelock ROLE_ADMIN, so it is able to manage roles and grant roles that are managed
      by this role.`
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096', // ROLE_ADMIN
        '{tribalCouncilTimelock}' // TribalCouncil timelock
      ],
      description: `
      Grant Tribal Council timelock the ROLE_ADMIN role. TribalCouncil will be able to manage Admin level roles
      and below
      `
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x6ecc8dff15d98038e3ff32bfe76768123628cfdd2c3d11f2ec23c5433a9d4ba3', // POD_ADMIN
        '{tribalCouncilTimelock}' // Tribal council timelock
      ],
      description: 'Grant POD_ADMIN to TribalCouncil timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0xf62a46a499242191aaab61084d4912c2c0a8c48e3d70edfb5a9be2bc9e92622f', // POD_METADATA_REGISTER_ROLE
        '{tribalCouncilSafe}'
      ],
      description: 'Grant TribalCouncil Gnosis Safe address role to register metadata'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e', // GOVERNOR
        '{roleBastion}' // RoleBastion
      ],
      description: 'Grant GOVERNOR role to RoleBastion. This will be used by the TribalCouncil to create new roles'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x29af6c210963c1cf458c6a5bf082996cf54b23ebba0c0fb8ae110e8e43371c71', // POD_VETO_ADMIN
        '{nopeDAO}' // Nope DAO
      ],
      description: 'Grant POD_VETO_ADMIN role to NopeDAO. This allows the NopeDAO to veto any pod timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x6ecc8dff15d98038e3ff32bfe76768123628cfdd2c3d11f2ec23c5433a9d4ba3', // POD_ADMIN
        '{podFactory}'
      ],
      description: 'Grant POD_ADMIN role to PodFactory, to allow it to call lock membership transfers'
    },
    //////////////    Configure Membership of Council and Pod /////////////
    {
      target: 'podAdminGateway',
      values: '0',
      method: 'batchAddPodMember(uint256 _podId,address[] memory _members)',
      arguments: [
        '24', // TODO: Update to correct TribalCouncil ID once pod is deployed
        [
          '0xc8eefb8b3d50ca87Da7F99a661720148acf97EfA', // TODO: Complete with real member addresses
          '0x72b7448f470D07222Dbf038407cD69CC380683F3',
          '0xA6D08774604d6Da7C96684ca6c4f61f89c4e5b96',
          '0xe0ac4559739bD36f0913FB0A3f5bFC19BCBaCD52',
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
      method: 'batchRemovePodMember(uint256 _podId, address[] memory)',
      arguments: [
        '24', // TODO: Update to correct TribalCouncil ID once pod is deployed
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
      method: 'lockMembershipTransfers(uint256 _podId)',
      arguments: ['24'],
      description: 'Lock TribalCouncil membership transfers'
    }
  ],
  description: `
  FIP-82 enacts the governance upgrade to the TRIBE DAO and deploys the TribalCouncil pod. Specifically, this FIP will:
  1. Deploy the relevant contracts for the Governance upgrade: PodFactory.sol, GovernanceMetadataRegistry.sol, PodAdminGateway.sol,
  RoleBastion.sol, NopeDAO.sol, PodExecutor.sol
  2. Create and grant the relevant new roles for the pod system
  3. Initialise the membership of the Tribal Council, as accordig to the members who were elected in the Snapshot vote:
  https://snapshot.fei.money/#/proposal/0x003adc2cb0f13784645e31440d24d0364817085aa1994e1ad72944d11bedb528 

  Forum post for the Governance upgrade: https://tribe.fei.money/t/fip-82-governance-enhancements/3945
  Snapshot vote authorising the upgrade: https://snapshot.fei.money/#/proposal/0x463fd1be98d9e86c83eb845ca7e2a5555387e3c86ca0b756aada17a11df87f2b

  There will be a second DAO vote to transfer various protocol roles to the TribalCouncil pod and to make it the admin of various roles - to allow it to 
  operate the protocol.
  `
};

export default fip_82;
