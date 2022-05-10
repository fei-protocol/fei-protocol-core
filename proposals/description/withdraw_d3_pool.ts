import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  // Curve/Convex reports balance in USD
  title: 'Withdraw from the D3Pool',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: ['{d3poolConvexPCVDeposit}', '{d3poolCurvePCVDeposit}', '30000000000000000000000000', false, false],
      description: 'Withdraw 30M USD worth of LP tokens to the d3PoolCurvePCVDeposit'
    },
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: ['{d3poolCurvePCVDeposit}', '{daiFixedPricePSM}', '10000000000000000000000000', false, false],
      description: 'Withdraw 10M worth of Fei from the Curve D3 pool to the DAI PSM'
    }
  ],
  description: `
  Withdraw 30M USD worth of LP tokens from the d3 pool on Curve. 
  
  Send the LP tokens to the d3PoolCurvePCVDeposit and then withdraw 10M FEI from the pool to the DAI PSM. 
  `
};

export default fip_x;
