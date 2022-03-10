import { ProposalDescription } from '@custom-types/types';
import {
  tribeCouncilPodConfig,
  placeHolderCouncilMembers,
  protocolPodConfig,
  placeHolderPodMembers
} from '@protocol/optimisticGovernance';

// TODO: Need to be able to inject podIds into here ideally. For now they're hardcoded
const fip_82: ProposalDescription = {
  title: 'FIP-82: Deploy TribalCouncil',
  commands: [
    //////////// GRANT POD TIMELOCKS RELEVANT ACCESS ROLES ///////////
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
        tribeCouncilPodConfig.members,
        '13', // TODO: Replace hardcoded value with real podId
        ''
      ],
      description: 'Add member to the Tribal Council'
    },
    // Remove initial placeholders members from the Tribal Council
    {
      target: 'memberToken',
      values: '0',
      method: 'burnSingleBatch(address[] memory,uint256)',
      arguments: [
        placeHolderCouncilMembers,
        '13', // TODO: Replace hardcoded value with real podId
        ''
      ],
      description: 'Burn placeholder deploy members from Tribal Council'
    },
    // Add members to the Protocol Pod
    {
      target: 'memberToken',
      values: '0',
      method: 'mintSingleBatch(address[] memory,uint256,bytes)',
      arguments: [
        protocolPodConfig.members,
        '14', // TODO: Replace with real protocol pod ID
        ''
      ],
      description: 'Add members to the Protocol Pod'
    },
    // Remove initial placeholder members from Protocol Pod
    {
      target: 'memberToken',
      values: '0',
      method: 'mintSingleBatch(address[] memory,uint256,bytes)',
      arguments: [
        placeHolderPodMembers,
        '14', // TODO: Replace with real protocol pod ID
        ''
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
