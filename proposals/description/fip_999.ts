import { ProposalDescription } from '@custom-types/types';

const fip_999: ProposalDescription = {
  title: 'FIP-XYZ: ------------------------',
  commands: [
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{balancerDepositBalWeth}', '200000000000000000000'],
      description: 'Withdraw 200 WETH from Aave to the BAL/WETH PCVDeposit'
    },
    {
      target: 'bal',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{balancerDepositBalWeth}', '200000000000000000000000'],
      description: 'Move 200k BAL from Timelock to the deposit'
    },
    {
      target: 'balancerDepositBalWeth',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit BAL and WETH in the Balancer pool'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: ['{balDepositWrapper}', '{balancerDepositBalWeth}'],
      description: 'Replace BAL Timelock Lens by BAL/WETH deposit in CR Oracle'
    }
  ],
  description: `

Summary:
------------------------

Specification:
------------------------

Forum discussion: ------------------------
Snapshot: ------------------------
`
};

export default fip_999;
