import { ProposalDescription } from '@custom-types/types';

const fip_53: ProposalDescription = {
  title: 'FIP-53: Farm d3Pool on Convex',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{feiDAOTimelock}', '50000000000000000000000000'],
      description: 'Mint 50M FEI for liquidity deposit'
    },
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{curveD3pool}', '50000000000000000000000000'],
      description: 'Approve 50M FEI for deposit on Curve d3pool'
    },
    {
      target: 'curveD3pool',
      values: '0',
      method: 'add_liquidity(uint256[3],uint256)',
      arguments: [
        [
          '0', // 0 FRAX
          '50000000000000000000000000', // 50M FEI
          '0' // 0 alUSD
        ],
        // we tolerate 0.5% slippage, set this value in Curve's UI and note the
        // minimum amount of LP tokens out https://curve.fi/factory/57/deposit
        '49580000000000000000000000' // min LP out
      ],
      description: 'Deposit 50M FEI in Curve to get LP tokens'
    },
    {
      target: 'curveD3pool',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{convexBooster}', '49580000000000000000000000'],
      description: 'Approve d3pool LP tokens to on Convex'
    },
    {
      target: 'convexBooster',
      values: '0',
      method: 'deposit(uint256,uint256,bool)',
      arguments: ['58', '49580000000000000000000000', true], // Convex d3pool id = 58
      description: 'Stake d3pool LP tokens on Convex'
    }
  ],
  description: `

Summary:
This proposal mints 50M FEI to deposit in the Curve d3pool (FRAX, FEI, alUSD), and stake the LP tokens on Convex to earn CRV & CVX rewards (currently ~30% APR).

Specification:
The DAO Timelock will mint itself 50M FEI, deposit in the d3pool, and then stake the LP tokens on Convex.

Forum discussion: https://tribe.fei.money/t/fip-xx-enter-the-curve-wars/3715/1
`
};

export default fip_53;
