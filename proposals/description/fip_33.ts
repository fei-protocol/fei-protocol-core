import { ProposalDescription } from '@custom-types/types';

const fip_33: ProposalDescription = {
  title: 'FIP-33: Balancer Treasury Swap',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{tribeBalOtcEscrow}', '2598000000000000000000000'],
      description: 'Allocate TRIBE to otc escrow'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{feiBalOtcEscrow}', '2454000000000000000000000'],
      description: 'Mint FEI to otc escrow'
    },
    {
      target: 'tribeBalOtcEscrow',
      values: '0',
      method: 'swap()',
      arguments: [],
      description: 'Swap TRIBE OTC'
    },
    {
      target: 'feiBalOtcEscrow',
      values: '0',
      method: 'swap()',
      arguments: [],
      description: 'Swap FEI OTC'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{ethTokemakPCVDeposit}'],
      description: 'Add ETH Tokemak PCV Deposit'
    }
  ],
  description: `

Summary:

Swap 2.454m FEI and 2.598m TRIBE for 200k BAL with Balancer DAO.

Motivation:

Given the upcoming Fei v2 launch on Balancer v2, both communities voted to align incentives by performing a treasury swap.

For details on the community discussions, see the below forums.

Proposal also updates collateralization oracle with new deposits.

Tribe: https://tribe.fei.money/t/fip-33-swap-between-balancer-dao-and-fei-dao/3555
Balancer: https://forum.balancer.fi/t/proposal-treasury-swap-balancer-dao-fei-dao/2254

Code: https://github.com/fei-protocol/fei-protocol-core/pull/316
`
};

export default fip_33;
