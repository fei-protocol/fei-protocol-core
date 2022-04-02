import { ProposalDescription } from '@custom-types/types';

const fip_92: ProposalDescription = {
  title: 'FIP-92: ANGLE Meta-governance',
  commands: [
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: [
        '{balancerDepositFeiWeth}', // deposit
        '{bal}', // token
        '{balancerDepositBalWeth}', // to
        '10000' // basis poins
      ],
      description: 'Move all BAL on FEI/WETH PCVDeposit to the BAL/WETH deposit'
    },
    {
      target: 'balancerDepositBalWeth',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit all BAL to get more B-80BAL-20WETH'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: [
        '{balancerDepositBalWeth}', // deposit
        '{bpt80Bal20Weth}', // token = B-80BAL-20WETH
        '{veBalDelegatorPCVDeposit}', // to
        '10000' // basis poins
      ],
      description: 'Move all B-80BAL-20WETH on new veBAL delegator'
    },
    {
      target: 'veBalDelegatorPCVDeposit',
      values: '0',
      method: 'lock()',
      arguments: [],
      description: 'Vote-lock B-80BAL-20WETH to veBAL'
    },
    {
      target: 'veBalDelegatorPCVDeposit',
      values: '0',
      method: 'setTokenToGauge(address,address)',
      arguments: [
        '{bpt30Fei70Weth}', // token address
        '{balancerGaugeBpt30Fei70Weth}' // gauge address
      ],
      description: 'Set Balancer B-30FEI-70WETH pool tokens gauge address'
    },
    {
      target: 'veBalDelegatorPCVDeposit',
      values: '0',
      method: 'voteForGaugeWeight(address,uint256)',
      arguments: [
        '{bpt30Fei70Weth}', // token address
        '10000' // weight
      ],
      description: 'Vote 100% weight for the B-30FEI-70WETH gauge'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: [
        '{balancerDepositFeiWeth}', // deposit
        '{bpt30Fei70Weth}', // token = B-30FEI-70WETH
        '{veBalDelegatorPCVDeposit}', // to
        '10000' // basis poins
      ],
      description: 'Move all B-30FEI-70WETH on new veBAL delegator'
    },
    {
      target: 'veBalDelegatorPCVDeposit',
      values: '0',
      method: 'stakeAllInGauge(address)',
      arguments: [
        '{bpt30Fei70Weth}' // token
      ],
      description: 'Stake all B-30FEI-70WETH in gauge'
    }
    /*
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [['{uniswapLensAgEurUniswapGauge}', '{agEurUniswapPCVDeposit}']],
      description: 'Add agEUR/FEI Uniswap Lens and agEUR Uniswap deposit to cr oracle'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{agEurUniswapPCVDeposit}'],
      description: 'Set agEUR Uniswap deposit as a safe address'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [['{agEurAngleUniswapPCVDeposit}']],
      description: 'Remove old AngleUniswapPCVDeposit from CR oracle'
    }*/
  ],
  description: `

todo

Forum discussion: https://tribe.fei.money/t/fip-92-vote-escrow-the-daos-bal-to-vebal/4058
Snapshot: todo
`
};

export default fip_92;
