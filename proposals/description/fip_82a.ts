import { ProposalDescription } from '@custom-types/types';

const fip_82a: ProposalDescription = {
  title: 'FIP-82a: Deploy TribalCouncil',
  // Create the pods, set members on the pods later.
  //  Two FIPs: one to deploy the infrastructure upgrade, one to set memberships
  commands: [
    // Create Tribal Council Pod
    {
      target: 'tribalCouncilPodFactory',
      values: '0',
      method: 'createChildOptimisticPod(address[] calldata,uint256,bytes32,string calldata,string calldata,uint256)',
      arguments: [
        [
          '0x0000000000000000000000000000000000000004', // TODO: Complete with real member addresses
          '0x0000000000000000000000000000000000000005',
          '0x0000000000000000000000000000000000000006',
          '0x0000000000000000000000000000000000000007',
          '0x0000000000000000000000000000000000000008',
          '0x0000000000000000000000000000000000000009',
          '0x000000000000000000000000000000000000000a',
          '0x000000000000000000000000000000000000000b',
          '0x000000000000000000000000000000000000000c'
        ], // 9 members. Not assigned initially
        '5', // 5 member threshold on multisig
        '0x68656c6c6f706f64000000000000000000000000000000000000000000000000',
        'hellopod.eth', // TODO: buy ENS names
        'hellopod.com', // TODO
        '0' // 4 days
      ],
      description: 'Deploy and initialise the Tribal Council'
    }
  ],
  description: `
  FIP-82a enacts the first stage of the governance upgrade to the TRIBE DAO
  Specifically, this FIP will:
  1. Create the Tribal Council Pod using a podFactory
  2. Assign the initial, previously voted on, members to the Tribal Council Pod
  `
};

export default fip_82a;
