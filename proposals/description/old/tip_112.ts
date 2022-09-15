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
  TIP-112: Fuse Redemption

  Summary: Whitelists the “Fuse Redemption Contract” as a safe PCV address for the Guardian to repay.
  
  Proposal:
  
  The community has signaled support for a PCV Redemption of the Fuse exploit in a previous snapshot.
  
  This proposal provides some technical details and associated timelines.
  
  First, the strategy for Redemption will be staged by asset.
  
  Redemption order will be assets currently in PCV first (RAI, DAI, FEI, ETH, LUSD), then external assets after associated conversions (USDC, USDT, FRAX). Both categories will be sorted by the smallest Redemption amount first.
  
  For assets currently in PCV, the capital will be sourced from the most liquid deposit of that type.
  
  The proposal simply whitelists the Redemption contract as a safe address for new PCV to be transferred in by the Guardian to repay. If any tokens remain in the contract after Redemption, they can be withdrawn back into PCV.
  
  In terms of timelines, it would take 1-2 days to repay assets in PCV, and up to a week to source the non PCV assets from proposal execution.  
  
  Voting options are YES, whitelist the fuse Redemption contract and begin immediate full Redemption, and NO, do not whitelist the fuse Redemption contract and begin immediate full Redemption.`
};

export default tip_112;
