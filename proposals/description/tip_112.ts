import { TemplatedProposalDescription } from '@custom-types/types';

const tip_112: TemplatedProposalDescription = {
  title: 'Repay Fuse Bad Debt',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: (addresses) => [addresses.fuseFixer],
      description: 'Set FuseFixer as a safe address'
    }
  ],
  description: `  
TIP-112: Fuse Repayment

Summary: Whitelists the “Fuse Repayment Contract” as a safe PCV address for the Tribal Council or PCV Guardian to repay.

Proposal:

The community has signaled support for a PCV repayment of the Fuse exploit in a previous snapshot. 
This proposal provides some technical details and associated timelines.

First, the strategy for repayment will be staged by asset. The affected assets are:

token │ amount stolen │ amount stolen usd

─────────┼─────────────────┼─────────────────────

FEI │ 20,251,603.12 │ $20,361,973.83

ETH │ 6,037.91 │ $17,062,057.88

DAI │ 14,278,990.68 │ $14,368,248.93

LUSD │ 1,948,952.18 │ $1,952,277.46

USDC │ 10,055,556.33 │ $10,019,382.03

FRAX │ 13,101,364.94 │ $13,108,022.66

RAI │ 31,615.87 │ $96,475.12

USDT │ 132,959.90 │ $133,620.54

Repayment order will be assets currently in PCV first (RAI, DAI, FEI, ETH, LUSD), then external assets after associated conversions (USDC, USDT, FRAX). Both categories will be sorted by the smallest repayment amount first. A special case is USTw, where the only supplier was Terraform Labs and the strategy will await further clarity from them.

For assets currently in PCV, the capital will be sourced from the most liquid deposit of that type, for example ETH would come from the Aave ETH deposit given it holds the most ETH.

The proposal simply whitelists the repayment contract as a safe address for new PCV to be transferred in by the Tribal council or PCV Guardian to repay. If any tokens remain in the contract after repayment, they can be withdrawn back into PCV.

In terms of timelines, it would take 1-2 days to repay assets in PCV, and up to a week to source the non PCV assets from proposal execution.  
`
};

export default tip_112;
