import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_120: TemplatedProposalDescription = {
  title: 'TIP-120: PCV Consolidation : Enable LUSD>DAI conversion',
  commands: [
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: (addresses) => [addresses.lusdToDaiCurveSwapper],
      description: 'Set LUSD->DAI Curve Swapper as a safe address'
    }
  ],
  description: `
  TIP-120: PCV Consolidation : Enable LUSD>DAI conversion

  This proposal adds a new LUSD to DAI swapper contract that performs swaps on Curve.

  These swaps can be triggered by the DAO Timelock, TC Timelock, and the Guardian multisig.

  The Guardian multisig might also deploy a new PCV Sentinel Guard to perform LUSD>DAI conversions permissionlessly as long as slippage is negative (>1 DAI per 1 LUSD spent). 

  The DAI received will be custodied on a PCVDeposit that doesn't re-allocate it in any other protocol (daiHoldingPCVDeposit).
  `
};

export default tip_120;
