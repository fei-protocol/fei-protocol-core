import { TemplatedProposalDescription } from '@custom-types/types';

const clawback: TemplatedProposalDescription = {
  title: 'FIP-113: End Departed Rari Founders Vesting of TRIBE',
  commands: [
    /////////  Mint FEI and TRIBE onto new RARI timelocks
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: (addresses) => [addresses.newRariInfraFeiTimelock, '3178504756468797564687976'],
      description: 'Mint FEI to the new Rari Infra FEI timelock'
    },

    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: (addresses) => [addresses.newRariInfraTribeTimelock, '3178502219685438863521056'],
      description: 'Allocate TRIBE to the new Rari Infra TRIBE timelock'
    },

    ////  Clawbacks
    {
      target: 'clawbackVestingContractA',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback the TRIBE of Jai Bhavnani and David Lucid'
    },
    {
      target: 'clawbackVestingContractB',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback the TRIBE of Jai Bhavnani and David Lucid'
    },
    {
      target: 'clawbackVestingContractC',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback the TRIBE of Jai Bhavnani and David Lucid'
    },

    //// Approve the Tribal Council Timelock for 20M TRIBE

    {
      target: 'tribe',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.tribalCouncilTimelock, '20000000000000000000000000'],
      description:
        'Approve the Tribal Council Timelock for 20M TRIBE. It will later transfer the TRIBE to the Core Treasury'
    }
  ],
  description: `
  FIP-113: End Departed Rari Founders Vesting of TRIBE

  This proposal enacts the steps discussed and detailed in the this forum post: https://tribe.fei.money/t/end-departed-rari-founders-vesting-of-tribe/4355

  Specifically, it:
  1. Mints FEI and allocates TRIBE to the newly deployed and migrated Rari Infrastructure team timelocks
  2. Clawback of Jai Bhavnani's and David Lucid's TRIBE vesting contracts
  3. Approves the Tribal Council timelock for 20M TRIBE, which it will later transfer to the Core Treasury
  `
};

export default clawback;
