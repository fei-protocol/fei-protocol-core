import { ProposalDescription } from '@custom-types/types';

const curve_swap_stables: ProposalDescription = {
  title: 'Curve swap stables',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{tribalCouncilTimelock}'],
      description: 'Set the TribalCouncil timelock as a safe address'
    },
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: ['{compoundDaiPCVDeposit}', '{tribalCouncilTimelock}', '10264000000000000000000000', false, false],
      description: 'Withdraw 10.264M DAI from the Compound DAI PCV deposit to the Tribal Council timelock'
    },
    {
      target: 'dai',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{curve3pool}', '10264000000000000000000000'],
      description: 'Approve 10.264M DAI for Curve 3Pool swaps'
    },
    {
      target: 'curve3pool',
      values: '0',
      method: 'exchange(int128,int128,uint256,uint256)',
      arguments: [
        '0', // i = DAI
        '1', // j = USDC
        '10130000000000000000000000', // dx = 10.13M DAI
        '10073986000000' // min_dy = 10.074M USDC
      ],
      description: 'Swap 10.13M DAI for at least 10.074M USDC via the 3Pool. This accepts up to ~0.55% slippage'
    },
    {
      target: 'curve3pool',
      values: '0',
      method: 'exchange(int128,int128,uint256,uint256)',
      arguments: [
        '0', // i = DAI
        '2', // j = USDT
        '134000000000000000000000', // dx = 134k DAI
        '133178000000' // min_dy = 133.178k USDT
      ],
      description: 'Swap 134k (0.134M) DAI for at least 133.178k USDT via the 3Pool. This accepts up to ~0.6% slippage'
    },
    {
      target: 'usdc',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{fuseFixer}', '10073986000000'],
      description: 'Transfer 10.074M USDC to the Fuse Fixer contract'
    },
    {
      target: 'usdt',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{fuseFixer}', '133178000000'],
      description: 'Transfer 133.178k USDT to the Fuse Fixer contract'
    }
  ],
  description: `
  Swap 10.264M DAI for ~10.1M USDC and ~134k USDT on Curve. 

  Then send the acquired USDC and USDT to the FuseFixer contract.
  `
};

export default curve_swap_stables;
