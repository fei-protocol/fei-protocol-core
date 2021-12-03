import { ProposalDescription } from '@custom-types/types';

const lusd_swap_grant_swapper_role: ProposalDescription = {
  title: 'Grant Swapper Admin Role to the OA & Swap',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816', '{optimisticTimelock}'],
      description: 'Grant SWAP_ADMIN_ROLE to the OA'
    },
    {
      target: 'feiLusdLBPSwapper',
      values: '0',
      method: 'swap()',
      arguments: [],
      description: 'Call swap on the LUSD BalancerLBPSwapper contract'
    }
  ],
  description: 'Grant Swapper Admin Role to the OA & Swap on the BalancerLBPSwapper'
};

export default lusd_swap_grant_swapper_role;
