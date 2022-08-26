import { TemplatedProposalDescription } from '@custom-types/types';

// Existing balance of FEI on the TC to burn
const TC_FEI_TO_BURN = '42905768215167745773610059';

// Clawed back FEI upper bound
const CLAWED_BACK_FEI_UPPER_BOUND = '2897332829955035696312531';

// Clawed back TRIBE upper bound
const CLAWED_BACK_TRIBE_UPPER_BOUND = '3068505367127310595321005';

// Tribal Council timelock asset balances
const TC_LQTY_BALANCE = '1101298805118942906652299';
const TC_IDLE_BALANCE = '16014201190265555827419';
const TC_FOX_BALANCE = '15316691965631380244403204';

const tc_consolidate: TemplatedProposalDescription = {
  title: 'TIP-122: Tribal Council consolidation',
  commands: [
    // 1. Burn the existing FEI on the TC timelock
    {
      target: 'fei',
      values: '0',
      method: 'burn(uint256)',
      arguments: (addresses) => [TC_FEI_TO_BURN],
      description: 'Burn all existing 42.9M FEI on the Tribal Council timelock'
    },
    // 2. Clawback the Rari Infrastructure timelocks
    {
      target: 'newRariInfraFeiTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'End the vesting of FEI to the Rari Infra FEI timelock, return funds to the Tribal Council timelock'
    },
    {
      target: 'newRariInfraTribeTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description:
        'End the vesting of TRIBE to the Rari Infra TRIBE timelock, return funds to the Tribal Council timelock'
    },
    // 3. Grant FEI and TRIBE approvals to DAO timelock, so funds can later be moved
    //    appropriately once final figures are known
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, CLAWED_BACK_FEI_UPPER_BOUND],
      description: `
      Approve the DAO timelock to move all Fei clawed back from the Rari Infra team
      It will later burn it.
      `
    },
    {
      target: 'tribe',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, CLAWED_BACK_TRIBE_UPPER_BOUND],
      description: `
      Approve the DAO timelock to move all TRIBE clawed back from the Rari Infra team.
      It will later send it to Core.
      `
    },
    // 4. Send IDLE to TC safe
    {
      target: 'idle',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.tribalCouncilSafe, TC_IDLE_BALANCE],
      description: 'Send all 16k IDLE to the TC safe'
    },
    // 5. Send all remaining assets to the DAO timelock
    {
      target: 'lqty',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, TC_LQTY_BALANCE],
      description: 'Send all 1.1M LQTY to the DAO timelock'
    },
    {
      target: 'fox',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, TC_FOX_BALANCE],
      description: 'Send all 15.3M FOX to the DAO timelock'
    }
  ],
  description: `
  TIP-122: Tribal Council consolidation

  1. Burn existing Fei held by the TC timelock
  2. End vesting of Rari Infrastructure team timelocks
  3. Grant FEI and TRIBE approvals to the DAO timelock, so funds can be later moved in a DAO vote
  4. Send IDLE to Tribal Council Safe
  5. Send all remaining assets to the DAO timelock
  `
};

export default tc_consolidate;
