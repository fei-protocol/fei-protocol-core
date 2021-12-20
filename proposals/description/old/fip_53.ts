import { ProposalDescription } from '@custom-types/types';

const fip_53: ProposalDescription = {
  title: 'FIP-53: Farm d3Pool on Convex',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{d3poolCurvePCVDeposit}', '50000000000000000000000000'],
      description: 'Mint 50M FEI for liquidity deposit'
    },
    {
      target: 'd3poolCurvePCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit 50M FEI in the d3pool'
    },
    {
      target: 'ratioPCVController',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: [
        '{d3poolCurvePCVDeposit}', // pcvDeposit : from Curve d3pool deposit
        '{curveD3pool}', // token : d3pool LP token
        '{d3poolConvexPCVDeposit}', // to
        '10000' // basisPoints : 100%
      ],
      description: 'Move all d3pool LP tokens to Convex deposit'
    },
    {
      target: 'd3poolConvexPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Stake ~50M$ of d3pool LP Tokens on Convex'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{d3poolCurvePCVDeposit}'],
      description: 'Add Curve d3pool PCV Deposit to CR Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{d3poolConvexPCVDeposit}'],
      description: 'Add Convex d3pool PCV Deposit to CR Oracle'
    }
  ],
  description: `

Summary:
This proposal mints 50M FEI to deposit in the Curve d3pool (FRAX, FEI, alUSD), and stake the LP tokens on Convex to earn CRV & CVX rewards (currently ~30% APR).

Specification:
The DAO Timelock will mint 50M FEI. FEI will be used to add liquidity in the d3pool, and then LP tokens will be staked on Convex.

Forum discussion: https://tribe.fei.money/t/fip-xx-enter-the-curve-wars/3715/1
Snapshot: https://snapshot.org/#/fei.eth/proposal/0x077e0478d6989697bf657af1c9fb8d1166275f1ead7926b97cbf1ef0668623e9
`
};

export default fip_53;
