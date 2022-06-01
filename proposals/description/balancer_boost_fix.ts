import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'Balancer Boost Delegation',
  commands: [
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'upgrade(address,address)',
      arguments: [
        '{balancerGaugeStaker}', // proxy
        '{balancerGaugeStakerImpl}' // implementation
      ],
      description: 'Upgrade balancerGaugeStaker implementation'
    },
    {
      target: 'balancerGaugeStaker',
      values: '0',
      method: 'initialize(address,address,address,address)',
      arguments: [
        '{core}', // _core
        '{balancerGaugeController}', // _gaugeController
        '{balancerMinter}', // _balancerMinter
        '{balancerVotingEscrowDelegation}' // _votingEscrowDelegation
      ],
      description: 'Initialize balancerGaugeStaker proxy state variables'
    },
    {
      target: 'balancerGaugeStaker',
      values: '0',
      method: 'create_boost(address,address,int256,uint256,uint256,uint256)',
      arguments: [
        '{veBalDelegatorPCVDeposit}', // address _delegator
        '{balancerGaugeStaker}', // address _receiver
        '10000', // int256 _percentage
        '1656547200', // uint256 _cancel_time = June 30 2022
        '1672444800', // uint256 _expire_time = December 31 2022
        '0' // uint256 _id
      ],
      description: 'Create boost delegation'
    }
  ],
  description: 'Delegate 100% of veBAL boost from veBalDelegatorPCVDeposit to balancerGaugeStaker.'
};

export default fip_x;
