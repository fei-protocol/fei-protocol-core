import { ProposalDescription } from '@custom-types/types';

const accounting: ProposalDescription = {
  title: 'FIP-82b: Authorise the TribalCouncil with necessary roles',
  commands: [
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [
        [
          '{balancerLensBpt30Fei70Weth}', // old FEI/WETH lens that reports WETH and pFEI
          '{d3poolConvexPCVDeposit}', // old Convex D3pool that reports "USD" and 1/3rd of FEI
          '{d3poolCurvePCVDeposit}' // old Curve D3pool that reports "USD" and 1/3rd of FEI
        ]
      ],
      description: 'Remove deprecated Lenses and PCV Deposits'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: [
        '{balancerFeiWethPool}', // _token
        '{balancerWeightedPoolOracleFeiWeth}' // _newOracle
      ],
      description: 'Set B-70WETH-30FEI Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: [
        '{curveD3pool}', // _token
        '{curvePoolOracleD3}' // _newOracle
      ],
      description: 'Set Curve d3pool Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [
        [
          '{gaugeLensBpt30Fei70WethGauge}', // directly add B-70WETH-30FEI gauge lens
          '{convexPCVDepositD3}', // updated D3pool Convex PCVDeposit
          '{curvePCVDepositPlainPoolD3}' // updated D3pool Curve PCVDeposit
        ]
      ],
      description: 'Add new Lenses and PCV Deposits'
    },
    {
      target: 'd3poolConvexPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: [
        '{convexPCVDepositD3}', // _to
        '49817687278780155379999541' // 100%
      ],
      description: 'Move all D3pool LP tokens to the new Convex PCVDeposit'
    },
    {
      target: 'convexPCVDepositD3',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit all D3pool LP tokens in the new Convex PCVDeposit'
    } /*,
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: [
        '{fei}', // _token
        '{oneConstantOracle}' // _newOracle
      ],
      description: 'Set FEI Oracle price to 1$ in COracle'
    }*/
  ],
  description: `
    Accounting changes :

    - All FEI counts as a liability
    - FEI in lending markets and AMMs counts as 1$ of PCV
    - Protocol-owned FEI is only used for PSMs and similar protocol contracts
  `
};

export default accounting;
