import { ProposalDescription } from '@custom-types/types';

const fip_82: ProposalDescription = {
  title: 'FIP-82: Liquid representative democracy governance upgrade',
  // Create the pods, set members on the pods later.
  //  Two FIPs: one to deploy the infrastructure upgrade, one to set memberships
  commands: [
    {
      target: 'daoPodFactory',
      values: '0',
      method: 'createChildOptimisticPod(address[] calldata,uint256,bytes32,string calldata,string calldata,uint256)',
      arguments: [
        [
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        ], // 9 members
        '5', // 5 member threshold on multisig
        'Tribal_Council',
        'tribalcouncil.eth',
        'tribalcouncil.com', // TODO
        '345600' // 4 days
      ],
      description: 'Deploy and initialise the Tribal Council'
    }
    // TODO: Need the address from the above action to set the admin.
    // {
    //   target: 'protocolTierPodFactory',
    //   values: '0',
    //   method: 'setPodAdmin(address)',
    //   arguments: ['{tribalCouncilPod}'],
    //   description: `
    //   Set the podAdmin for the protocolTierPodFactory. This address will use the deployer to deploy optimistic
    //   governance pods
    //   `
    // },
    // {
    //   target: 'tribalCouncilPod',
    //   values: '0',
    //   method: 'createChildOptimisticPod(address[] calldata,uint256,bytes32,string calldata,string calldata,uint256)',
    //   arguments: [
    //     [
    //       '0x0000000000000000000000000000000000000000000000000000000000000000',
    //       '0x0000000000000000000000000000000000000000000000000000000000000000',
    //       '0x0000000000000000000000000000000000000000000000000000000000000000',
    //       '0x0000000000000000000000000000000000000000000000000000000000000000',
    //       '0x0000000000000000000000000000000000000000000000000000000000000000'
    //     ], // 5 members
    //     '3', // 3 member threshold on multisig
    //     'Fei_pod',
    //     'feipod.eth',
    //     'feipod.com', // TODO
    //     '172800' // 2 days
    //   ],
    //   description: `
    //   Deploy the Fei pod
    //   `
    // },
    // {
    //   target: 'core',
    //   values: '0',
    //   method: 'grantRole(bytes32,address)',
    //   arguments: [
    //     '0x498a9dae57f391d8efcc7bb3e7440ad6a25b1261044ef1b555c5484cb9f67659', // MINTER_ADMIN
    //     '{feiPod}'
    //   ],
    //   description: `
    //   Grant Fei pod role of MINTER_ADMIN
    //   `
    // }
  ],
  description: `
  FIP-82 enacts a governance upgrade to the TRIBE DAO, moving it into a liquid 
  representative democracy paradigm. Specifically, this FIP will:
  1. Deploy the Tribal Council Pod using the relevant podFactory
  2. Set the podAdmin for the protocolTierPodFactory that will deploy the protocol pods
  3. Deploy the Fei pod
  4. Grant the Fei pod the relevant access and role
  `
};

export default fip_82;
