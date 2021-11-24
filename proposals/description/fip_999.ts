import { ProposalDescription } from '@custom-types/types';

const fip_999: ProposalDescription = {
  title: 'FIP-999: ------------------------',
  commands: [
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{balancerDepositBalEth}', '230000000000000000000'],
      description: 'Withdraw 230 WETH from Aave to the BAL/WETH PCVDeposit'
    },
    {
      target: 'bal',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{balancerDepositBalEth}', '200000000000000000000000'],
      description: 'Move 200k BAL from Timelock to the deposit'
    },
    {
      target: 'balancerDepositBalEth',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit BAL and WETH in the Balancer pool'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: ['{bal}', '{compositeOracleBalUsd}'],
      description: 'Set BAL oracle in CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{balancerDepositBalEth}'],
      description: 'Add BAL deposit to CR Oracle'
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
