import { TemplatedProposalDescription } from '@custom-types/types';

const tip_119: TemplatedProposalDescription = {
  title: 'TIP-119: gOHM to Collaterisation Oracle, Swap USDC',
  commands: [
    // 1. Track gOHM in the CR
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: (addresses) => [addresses.gohm, addresses.gOhmUSDOracle],
      description: 'Set the gOHM USD oracle on the Collaterisation Oracle, to support the gOHM holding deposit'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: (addresses) => [addresses.gOHMHoldingPCVDeposit],
      description: 'Add the gOHM Holding PCV Deposit. Will contribute ~$1.5M to PCV equity'
    },
    // 2. Swap USDC for DAI via Maker PSM
    {
      target: 'usdc',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.makerUSDCGemJoin, '1024742540680'],
      description: 'Approve Maker USDC Gem Join adapter, to allow PSM to pull USDC and swap for DAI'
    },
    {
      target: 'makerUSDCPSM',
      values: '0',
      method: 'sellGem(address,uint256)',
      arguments: (addresses) => [addresses.compoundDaiPCVDeposit, '1024742540680'],
      description: `
      Swap ~$1m USDC for DAI, via the feeless Maker PSM and send to the Compound PCV DAI deposit
      `
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: (addresses) => [],
      description: 'Deposit DAI into Compound'
    },
    // 3. Burn FEI on the TC timelock
    {
      target: 'fei',
      values: '0',
      method: 'burn(uint256)',
      arguments: (addresses) => ['42905768215167745773610059'],
      description: 'Burn all FEI on the Tribal Council timelock'
    }
  ],
  description: `
  TIP-119: gOHM to Collaterisation Oracle, Swap USDC

  This proposal is a technical maintenance and cleanup proposal which performs
  various updates to the Collaterisation Oracle so that it most accurately reflects
  the current PCV holdings. 

  Specifically, it:
  - Registers the gOHM USD oracle on the Collaterisation Oracle
  - Adds the gOHM Holding PCV deposit to the Collaterisation Oracle. 
    Will contribute ~$1.5M to PCV equity
  - Swaps the USDC held on the Tribal Council timelock for DAI, via the Maker PSM. 
    Sends it to the Compound DAI PCV deposit. Will contribute ~$1M to PCV equity.
  - Burns all FEI (~43M) on the Tribal Council timelock.

  Adding these assets into the accounting through this proposal, will have the net effect
  of increasing PCV equity by ~$2.5M.
  `
};

export default tip_119;
