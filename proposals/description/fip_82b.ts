import { ProposalDescription } from '@custom-types/types';

const fip_82b: ProposalDescription = {
  title: 'FIP_82b: Initialise TribalCouncil and deploy protocol tier pod',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x2172861495e7b85edac73e3cd5fbb42dd675baadf627720e687bcfdaca025096', '{tribalCouncilTimelock}'],
      description: 'Grant Tribal Council ROLE_ADMIN'
    },
    {
      target: 'protocolTierPodFactory',
      values: '0',
      method: 'createChildOptimisticPod(address[] calldata,uint256,bytes32,string calldata,string calldata,uint256)',
      arguments: [
        [
          '0x0000000000000000000000000000000000000000000000000000000000000004',
          '0x0000000000000000000000000000000000000000000000000000000000000005',
          '0x0000000000000000000000000000000000000000000000000000000000000006',
          '0x0000000000000000000000000000000000000000000000000000000000000007',
          '0x0000000000000000000000000000000000000000000000000000000000000008'
        ], // 5 members
        '3', // 3 member threshold on multisig
        'Fei_pod',
        'feipod.eth',
        'feipod.com', // TODO
        '172800' // 2 days
      ],
      description: `
      Create the Fei optimistic pod
      `
    }
    // TODO: Grant relevant roles to the Fei pod
  ],
  description: `
  FIP-82b enacts the second stage of the governance upgrade to the TRIBE DAO
  Specifically, this FIP will:
  1. Grant the TribalCouncil the role of ROLE_ADMIN, to allow it to administer protocol pods
  2. Create the first protocol pod, with it's previously voted on members
  3. Grant the protocol pod the relevant roles
  `
};
export default fip_82b;
