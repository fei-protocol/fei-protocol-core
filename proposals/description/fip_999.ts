import { ProposalDescription } from '@custom-types/types';

const fip_999: ProposalDescription = {
  title: 'FIP-999: ------------------------',
  commands: [
    /*{
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{balancerDepositBalWeth}', '230000000000000000000'],
      description: 'Withdraw 230 WETH from Aave to the BAL/WETH PCVDeposit'
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
      method: 'setOracle(address,address)',
      arguments: ['{bal}', '{compositeOracleBalUsd}'],
      description: 'Set BAL oracle in CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{balancerDepositBalWeth}'],
      description: 'Add BAL deposit to CR Oracle'
    },
    {
      target: 'ethLidoPCVDeposit',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: ['{steth}', '{feiDAOTimelock}', '20000000000000000000000'],
      description: 'Move 20,000 stETH to Timelock'
    },
    {
      target: 'steth',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{wsteth}', '20000000000000000000000'],
      description: 'Approve 20,000 stETH on wstETH'
    },
    {
      target: 'wsteth',
      values: '0',
      method: 'wrap(uint256)',
      arguments: ['20000000000000000000000'],
      description: 'Wrap 20,000 stETH to wstETH'
    },
    {
      target: 'wsteth',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{balancerDepositWstethWeth}', '19000000000000000000000'],
      description: 'Move 19,000 wstETH to Balancer wstETH/WETH pool deposit'
    },
    {
      target: 'compoundEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{balancerDepositWstethWeth}', '21000000000000000000000'],
      description: 'Move 21,000 WETH from Compound to Balancer wstETH/WETH pool deposit'
    },
    {
      target: 'balancerDepositWstethWeth',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit 38,000 ETH in the balancer pool'
    }*/
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
