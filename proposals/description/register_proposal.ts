import { ProposalDescription } from '@custom-types/types';

const register_proposal: ProposalDescription = {
  title: 'Register TC Proposal and grant pod metadata roles',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0xf62a46a499242191aaab61084d4912c2c0a8c48e3d70edfb5a9be2bc9e92622f', // POD_METADATA_REGISTER_ROLE
        '0x64c4Bffb220818F0f2ee6DAe7A2F17D92b359c5d'
      ],
      description: 'Grant Tribe dev, Tom, POD_METADATA_REGISTER_ROLE to register proposal metadata'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0xf62a46a499242191aaab61084d4912c2c0a8c48e3d70edfb5a9be2bc9e92622f', // POD_METADATA_REGISTER_ROLE
        '0x5346b4ff3e924508d33d93f352d11e392a7a9d3b'
      ],
      description: 'Grant Tribe dev, Caleb, POD_METADATA_REGISTER_ROLE to register proposal metadata'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0xf62a46a499242191aaab61084d4912c2c0a8c48e3d70edfb5a9be2bc9e92622f', // POD_METADATA_REGISTER_ROLE
        '0xcE96fE7Eb7186E9F894DE7703B4DF8ea60E2dD77'
      ],
      description: 'Grant Tribe dev, Erwan, POD_METADATA_REGISTER_ROLE to register proposal metadata'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0xf62a46a499242191aaab61084d4912c2c0a8c48e3d70edfb5a9be2bc9e92622f', // POD_METADATA_REGISTER_ROLE
        '0xE2388f22cf5e328C197D6530663809cc0408a510'
      ],
      description: 'Grant Tribe dev, Joey, POD_METADATA_REGISTER_ROLE to register proposal metadata'
    }
  ],
  description: `
  Grant Tribe engineers the POD_METADATA_REGISTER_ROLE so they are able to register pod proposal metadata
  `
};

export default register_proposal;
