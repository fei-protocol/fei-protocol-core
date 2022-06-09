import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'Balancer Gauge Staker',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{balancerGaugeStaker}'],
      description: 'Set balancerGaugeStaker as safe address'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x3bee38c33241595abfefa470fd75bfa1cc9cb01eff02cf6732fd2baea4ea4241', // METAGOVERNANCE_GAUGE_ADMIN
        '{tribalCouncilTimelock}'
      ],
      description: 'Grant TC Timelock the METAGOVERNANCE_GAUGE_ADMIN role'
    },
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
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawERC20ToSafeAddress(address,address,address,uint256,bool,bool)',
      arguments: [
        '{balancerDepositFeiWeth}', // address pcvDeposit
        '{balancerGaugeStaker}', // address safeAddress
        '{bpt30Fei70Weth}', // address token
        '252865858892972812879565', // uint256 amount
        false, // bool pauseAfter
        false // bool depositAfter
      ],
      description: 'Move all LP tokens to the new gauge staker'
    },
    {
      target: 'balancerGaugeStaker',
      values: '0',
      method: 'stakeInGauge(address,uint256)',
      arguments: [
        '{bpt30Fei70Weth}', // token
        '252865858892972812879565' // amount
      ],
      description: 'Stake all B-30FEI-70WETH in gauge'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: ['{balancerLensBpt30Fei70WethOld}', '{balancerLensBpt30Fei70Weth}'],
      description: 'Add new FEI/WETH Lens to CR oracle & swap out the old one'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{balancerGaugeStaker}'],
      description: 'Count farmed BAL in the CR Oracle'
    }
  ],
  description: 'Migrate liquidity to a new Balancer Gauge Staker which is able to claim BAL rewards.'
};

export default fip_x;
