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
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e' // GOVERN_ROLE
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
    //////////  Lock burner deployed Tribal Council /////////////
    {
      target: 'podAdminGateway',
      values: '0',
      method: 'lockMembershipTransfers(uint256 _podId)',
      arguments: ['24'],
      description: 'Lock TribalCouncil pod membership transfers'
    },
    ///////// Transfer all non-major role admins to the ROLE_ADMIN, to allow TribalCouncil to manage ////////
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0xc307c44629779eb8fc0b85f224c3d22f5876a6c84de0ee42d481eb7814f0d3a8', // ORACLE_ADMIN
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Transfer ORACLE_ADMIN role admin from GOVERNOR to ROLE_ADMIN'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x23970cab3799b6876df4319661e6c03cc45bd59628799d92e988dd8cbdc90e31', // TRIBAL_CHIEF_ADMIN
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Transfer TRIBAL_CHIEF_ADMIN role admin from GOVERNOR to ROLE_ADMIN'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0xdf6ce05acd28d71e96472375ef55c4a692f167af3ccda9500570f7373c1ba22c', // PCV_GUARDIAN_ADMIN
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Transfer PCV_GUARDIAN_ADMIN role admin from GOVERNOR to ROLE_ADMIN'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0xb02f76effb323167cad756bb4f3edbfb9d9291f9bfcdc72c9ceea005562f32eb', // METAGOVERNANCE_VOTE_ADMIN
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Transfer METAGOVERNANCE_VOTE_ADMIN role admin from GOVERNOR to ROLE_ADMIN'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0xa100760f521bbb2848bef0b72ea29301f6a6b0605d004243f0eea2b1c359f7c7', // METAGOVERNANCE_TOKEN_STAKING
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Transfer METAGOVERNANCE_TOKEN_STAKING role admin from GOVERNOR to ROLE_ADMIN'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x3bee38c33241595abfefa470fd75bfa1cc9cb01eff02cf6732fd2baea4ea4241', // METAGOVERNANCE_GAUGE_ADMIN
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Transfer METAGOVERNANCE_GAUGE_ADMIN role admin from GOVERNOR to ROLE_ADMIN'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816', // LBP_SWAP_ROLE
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Transfer LBP_SWAP_ROLE role admin from GOVERNOR to ROLE_ADMIN'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x2d46c62aa6fbc9b550f22e00476aebb90f4ea69cd492a68db4d444217763330d', // VOTIUM_ROLE
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Transfer VOTIUM_ROLE role admin from GOVERNOR to ROLE_ADMIN'
    },
    //////// Create new roles for the Tribal Council to manage /////////
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x7f85477db6c0857f19179a2b3846a7ddbc64caeeb3a02ef34771b82f5ab926e4', // FUSE_ADMIN
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Create FUSE_ADMIN role, assigning ROLE_ADMIN as the role admin'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x0ff6b7c6babd735fee69a0a83901c004544f96c586fe8cf330aa1f80693916e9', // FEI_MINT_ADMIN
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Create FEI_MINT_ADMIN role, assigning ROLE_ADMIN as the role admin'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77', // PCV_ADMIN
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Create PCV_ADMIN role, assigning ROLE_ADMIN as the role admin'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x1749ca1ca3564d20da6efea465c2a5ae869a9e4b006da7035e688beb14d704e0', // PSM_ADMIN_ROLE
        '0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096' // ROLE_ADMIN
      ],
      description: 'Create PSM_ADMIN_ROLE role, assigning ROLE_ADMIN as the role admin'
    },
    /////////   Set the relevant contract admins to the newly created roles //////////
    // FUSE_ADMIN
    {
      target: 'fuseGuardian',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x7f85477db6c0857f19179a2b3846a7ddbc64caeeb3a02ef34771b82f5ab926e4' // FUSE_ADMIN
      ],
      description: 'Set the contract admin of the FuseGuardian to be the FUSE_ADMIN'
    },
    // FEI_MINT_ADMIN
    // TODO: Verify that by FeiTimedMinter we mean OptimisticMinter. Source code suggests yes
    {
      target: 'optimisticMinter',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x0ff6b7c6babd735fee69a0a83901c004544f96c586fe8cf330aa1f80693916e9' // FEI_MINT_ADMIN
      ],
      description: 'Set the contract admin of the FeiTimedMinter to be the FEI_MINT_ADMIN'
    },
    {
      target: 'pcvEquityMinter',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x0ff6b7c6babd735fee69a0a83901c004544f96c586fe8cf330aa1f80693916e9' // FEI_MINT_ADMIN
      ],
      description: 'Set the contract admin of the PCV Equity Minter to be the FEI_MINT_ADMIN'
    },
    /// PCV_ADMIN
    {
      target: 'ethLidoPCVDeposit',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the EthLidoPCVDeposit to be the PCV_ADMIN'
    },
    {
      target: 'indexDelegator', // this is SnapshotDelegatorPCVDeposit
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the indexDelegator to be the PCV_ADMIN'
    },
    {
      target: 'ethTokemakPCVDeposit', // TokemakPCVDepositBase
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the ethTokemarkPCVdeposit to be the PCV_ADMIN'
    },
    {
      target: 'uniswapPCVDeposit',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the uniswapPCVDeposit to be the PCV_ADMIN'
    },
    {
      target: 'daiPSMFeiSkimmer',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the DAI PSM Fei Skimmer to be the PCV_ADMIN'
    },
    {
      target: 'lusdPSMFeiSkimmer',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the LUSD PSM Fei Skimmer to be the PCV_ADMIN'
    },
    {
      target: 'ethPSMFeiSkimmer',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the ETH PSM Fei Skimmer to be the PCV_ADMIN'
    },
    {
      target: 'aaveEthPCVDripController',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the Aave Eth PCV Drip Controller to be the PCV_ADMIN'
    },
    {
      target: 'daiPCVDripController',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the DAI PCV Drip Controller to be the PCV_ADMIN'
    },
    {
      target: 'lusdPCVDripController',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the LUSDC PCV Drip Controller to be the PCV_ADMIN'
    },
    {
      target: 'compoundEthPCVDripController',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77' // PCV_ADMIN
      ],
      description: 'Set the contract admin of the Compound ETH PCV Drip Controller to be the PCV_ADMIN'
    },
    //////////  Grant the Tribal Council timelock the relevant roles //////////
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x7f85477db6c0857f19179a2b3846a7ddbc64caeeb3a02ef34771b82f5ab926e4', // FUSE_ADMIN
        '{tribalCouncilTimelock}'
      ],
      description: 'Grant TribalCouncil timelock the FUSE_ADMIN role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x0ff6b7c6babd735fee69a0a83901c004544f96c586fe8cf330aa1f80693916e9', // FEI_MINT_ADMIN
        '{tribalCouncilTimelock}'
      ],
      description: 'Grant TribalCouncil timelock the FEI_MINT_ADMIN role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x181266465276a82f8dff2d683e001b5f74ffd4d54185db2f2a62bdb11f465a77', // PCV_ADMIN
        '{tribalCouncilTimelock}'
      ],
      description: 'Grant TribalCouncil timelock the PCV_ADMIN role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0xdf6ce05acd28d71e96472375ef55c4a692f167af3ccda9500570f7373c1ba22c', // PCV_GUARDIAN_ADMIN_ROLE
        '{tribalCouncilTimelock}'
      ],
      description: 'Grant TribalCouncil timelock the PCV_GUARDIAN_ADMIN_ROLE role'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0xc307c44629779eb8fc0b85f224c3d22f5876a6c84de0ee42d481eb7814f0d3a8', // ORACLE_ADMIN_ROLE
        '{tribalCouncilTimelock}'
      ],
      description: 'Grant TribalCouncil timelock the ORACLE_ADMIN_ROLE'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x1749ca1ca3564d20da6efea465c2a5ae869a9e4b006da7035e688beb14d704e0', // PSM_ADMIN_ROLE
        '{tribalCouncilTimelock}'
      ],
      description: 'Grant TribalCouncil timelock the PSM_ADMIN_ROLE'
    }
  ],
  description: `
  FIP-82 enacts the governance upgrade to the TRIBE DAO and deploys the TribalCouncil pod. Specifically, this FIP will:
  1. Create roles for the new governance system
  2. Grant relevant roles to the Tribal Council and infrastructure in the new governance system
  3. Initialise the membership of the Tribal Council

  Snapshot vote: https://snapshot.fei.money/#/proposal/0x463fd1be98d9e86c83eb845ca7e2a5555387e3c86ca0b756aada17a11df87f2b
  Forum post discussion: https://tribe.fei.money/t/fip-82-governance-enhancements/3945
  `
};

export default fip_82;
