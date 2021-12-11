import { ProposalDescription } from '@custom-types/types';

const fip_38: ProposalDescription = {
  title: 'FIP-38: Tokemak Reactor and Swap',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{optimisticTimelock}', '6000000000000000000000000'],
      description: 'Seed OA Multisig with 6M TRIBE for OTC deal'
    },
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{aaveEthPCVDeposit}', '5000000000000000000000'],
      description: 'Withdraw 5000 WETH from Aave to self'
    },
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdrawETH(address,uint256)',
      arguments: ['{ethTokemakPCVDeposit}', '5000000000000000000000'],
      description: 'Unwrap 5000 WETH from aaveEthPCVDeposit and send 5000 ETH to Tokemak deposit'
    },
    {
      target: 'compoundEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{ethTokemakPCVDeposit}', '5000000000000000000000'],
      description: 'Withdraw 5000 ETH from Compound deposit to Tokemak deposit'
    },
    {
      target: 'ethTokemakPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit 10000 ETH in Tokemak'
    },
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x6c9ecf07a5886fd74a8d32f4d3c317a7d5e5b5c7a073a3ab06c217e9ce5288e3',
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e'
      ],
      description: 'Create TOKEMAK_DEPOSIT_ADMIN_ROLE role'
    },
    {
      target: 'ethTokemakPCVDeposit',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: ['0x6c9ecf07a5886fd74a8d32f4d3c317a7d5e5b5c7a073a3ab06c217e9ce5288e3'],
      description: 'Set TOKEMAK_DEPOSIT_ADMIN_ROLE role to admin for ETH Tokemak deposit'
    },
    {
      target: 'tokeTokemakPCVDeposit',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: ['0x6c9ecf07a5886fd74a8d32f4d3c317a7d5e5b5c7a073a3ab06c217e9ce5288e3'],
      description: 'Set TOKEMAK_DEPOSIT_ADMIN_ROLE role to admin for TOKE Tokemak deposit'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x6c9ecf07a5886fd74a8d32f4d3c317a7d5e5b5c7a073a3ab06c217e9ce5288e3', '{optimisticTimelock}'],
      description: 'Grant TOKEMAK_DEPOSIT_ADMIN_ROLE role to OA Multisig'
    }
  ],
  description: `

Summary:
Commit to seeding 6M TRIBE for TOKE if a Tokemak reactor is spun up.
Also, deposit 10k ETH in single sided LP.

Proposal:
A TRIBE reactor on Tokemak will improve liquidity for TRIBE trading pairs across trading venues and open up additional opportunities to leverage Tokemak with the aim of including FEI as a base asset when the Toke Community diversifies from centralized stablecoin base assets.

To initialize a TRIBE reactor, Tokemak requires an operational reserve of TRIBE to efficiently deploy TRIBE liquidity to trading venues (Uniswap, SushiSwap, 0x, Balancer) and make TRIBE LPs on Tokemak benefit from IL mitigation. This can be structured as follows:

The Fei DAO to make 6M TRIBE available to the Tokemak reactor reserve by proceeding with a DAO-to-DAO trade for equivalent value in TOKE.

After receiving TOKE, this will be staked single-sided to earn additional TOKE.

This part of the proposal can be completed by Optimistic Approval through the timelock.

In the meantime, 10k ETH will also be staked single-sided to earn additional TOKE, this ETH will come from Aave and Compound.

A future proposal can determine whether to LP with the TOKE for a higher APR, and whether to supply additional TRIBE for liquidity.

Snapshot: https://snapshot.fei.money/#/proposal/0x9bf4cd1d36597d27303caaefc9c27f3df3cc4939dcf8a4c8ea64b0f528245294
Forum discussion: https://tribe.fei.money/t/fip-38-tokemak-tribe-reactor-treasury-swap/3580
Code: https://github.com/fei-protocol/fei-protocol-core/pull/283
`
};

export default fip_38;
