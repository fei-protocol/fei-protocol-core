import { ProposalDescription } from '@custom-types/types';

const curve_swap_stables: ProposalDescription = {
  title: 'Curve swap stables',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: ['{compoundDaiPCVDeposit}', '{tribalCouncilTimelock}', '10500000000000000000000000', false, false],
      description: 'Withdraw 10.5M DAI from the Compound DAI PCV deposit to the Tribal Council timelock'
    },
    {
      target: 'dai',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{curve3pool}', '10500000000000000000000000'],
      description: 'Approve 10.5M DAI for Curve 3Pool swaps'
    },
    {
      target: 'curve3pool',
      values: '0',
      method: 'exchange(int128,int128,uint256,uint256)',
      arguments: [
        '0', // i = DAI
        '1', // j = USDC
        '10300000000000000000000000', // dx = 10.3M DAI
        '10100000000000' // min_dy = 10.1M USDC
      ],
      description: 'Swap 10.3M DAI for 10.1M USDC via the 3Pool'
    },
    {
      target: 'curve3pool',
      values: '0',
      method: 'exchange(int128,int128,uint256,uint256)',
      arguments: [
        '0', // i = DAI
        '2', // j = USDT
        '134000000000000000000000', // dx = 134k DAI
        '134000000000' // min_dy = 134k USDT
      ],
      description: 'Swap 134k DAI for 134k USDT via the 3Pool'
    }
  ],
  description: 'Swap DAI for USDC and USDT on Curve'
};

export default curve_swap_stables;
