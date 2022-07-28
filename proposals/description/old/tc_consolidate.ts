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
  title: 'TIP-122: End Rari team vesting and consolidate Tribal Council assets',
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
  TIP-122: End Rari team vesting and consolidate Tribal Council assets

  This proposal ends the vesting of the Rari Infrastructure team by clawing back their Fei and Tribe timelocks. It also consolidates the assets present on the Tribal Council timelock.

  End of Rari Team Vesting
  —--------------------------------
  The Rari Infrastructure team has two timelocks in which funds are vesting. There is a FEI vesting timelock (https://etherscan.io/address/0x5d39721BA1c734b395C2CAdbdeeC178F688F6ec9) and a TRIBE vesting timelock (https://etherscan.io/address/0x20bC8FE104fadED2D0aD9634D745f1488f9991eF). There is ~2.8M FEI and ~2.8M TRIBE available to be clawed back from these timelocks. 

  The funds will be returned to the Tribal Council timelock. An approval is granted to the DAO timelock to later allow the DAO to move the recovered FEI and TRIBE. 

  Asset consolidation
  —-------------------------
  The Tribal Council timelock has various assets which are being consolidated and moved off the timelock:
  ~43M FEI is being burned
  ~1.1M LQTY is being sent to the DAO timelock
  ~15.3M FOX is being sent to the DAO timelock
  ~16k IDLE is being sent to the Tribal Council Safe, where it will then be sold

  The optimistic governance process used by the Tribe DAO and the role of the NopeDAO is documented here: https://docs.tribedao.xyz/docs/Governance/Overview 
  `
};

export default tc_consolidate;
