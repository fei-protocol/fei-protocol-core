import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'Balancer Gauge Staker',
  commands: [
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{balancerGaugeStaker}'],
      description: 'Set balancerGaugeStaker as safe address'
    },
    // TODO: TC grants itself the gauge admin role
    {
      target: 'balancerGaugeStaker',
      values: '0',
      method: 'setTokenToGauge(address,address)',
      arguments: [
        '{bpt30Fei70Weth}', // token address
        '{balancerGaugeBpt30Fei70Weth}' // gauge address
      ],
      description: 'Set Balancer B-30FEI-70WETH pool tokens gauge address'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: [
        '{bpt30Fei70Weth}', // token
        '{balancerDepositFeiWeth}', // from
        '{balancerGaugeStaker}', // to
        '10000' // 100%
      ],
      description: 'Move all LP tokens to the new gauge staker'
    },
    {
      target: 'balancerGaugeStaker',
      values: '0',
      method: 'stakeAllInGauge(address)',
      arguments: [
        '{bpt30Fei70Weth}' // token
      ],
      description: 'Stake all B-30FEI-70WETH in gauge'
    }
  ],
  description: 'Migrate liquidity to a new Balancer Gauge Staker which is able to claim BAL rewards.'
};

export default fip_x;
