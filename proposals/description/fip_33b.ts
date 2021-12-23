import { ProposalDescription } from '@custom-types/types';

const fip_33b: ProposalDescription = {
  title: 'FIP-33b: Deposit 200,000 BAL in the BAL/WETH pool',
  commands: [
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{balancerDepositBalWeth}', '250000000000000000000'],
      description: 'Withdraw 250 WETH from Aave to the BAL/WETH PCVDeposit'
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
This proposal is a follow-up to FIP-33: Swap between Balancer DAO and Fei DAO

Specification:
From the original FIP-33 snapshot: "Fei DAO will deposit BAL into BAL/WETH 80/20 paired with ETH from the PCV and commits to holding for the long run".

This proposal moves the 200,000 BAL received by OTC to the BAL/WETH 80/20 pool, along with 250 WETH from Aave to reduce slippage.

Forum discussion: https://tribe.fei.money/t/fip-33-swap-between-balancer-dao-and-fei-dao/3555
Snapshot: https://snapshot.org/#/fei.eth/proposal/QmZRQGzAxYFQDTPoXKwsjySMTV3iyT9S8V8zLyscWJGeUq
`
};

export default fip_33b;
