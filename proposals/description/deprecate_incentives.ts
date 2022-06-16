import { TemplatedProposalDescription } from '@custom-types/types';

const deprecate_incentives: TemplatedProposalDescription = {
  title: 'TIP-114: Deprecate TRIBE Incentives system',
  commands: [
    // Withdraw excess TRIBE from reward system

    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: (addresses) => [
        addresses.tribalChief,
        addresses.tribalCouncilTimelock,
        '10000000000000000000000000', // TODO: Update number with correct figure
        false,
        false
      ],
      description: 'Withdraw 10M TRIBE from the Tribal Chief to the Tribal Council timelock'
    },
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: (addresses) => [
        addresses.erc20Dripper,
        addresses.tribalCouncilTimelock,
        '2508838570600494412126519',
        false,
        false
      ],
      description: 'Withdraw 2.5M TRIBE from the ERC20 Dripper to the Tribal Council timelock'
    },
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: (addresses) => [
        addresses.votiumBriber3Crvpool,
        addresses.tribalCouncilTimelock,
        '200891359701492537313432',
        false,
        false
      ],
      description: 'Withdraw 200k TRIBE from 3CRV Votium briber contract Tribal Council timelock'
    },

    /// Transfer claimed TRIBE to the Core Treasury
    {
      target: 'tribe',
      values: '0',
      method: 'transferFrom(address,address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, addresses.core, '16928757542558284368284929'],
      description: 'Transfer previously clawed back TRIBE from TRIBE DAO timelock to the Core Treasury'
    },
    {
      target: 'tribe',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.core, '0'], // TODO: Update number with correct figure
      description: 'Transfer all withdrawn TRIBE from the Tribal Council timelock to the Core Treasury'
    }
  ],
  description: `
  TIP-114: Deprecate TRIBE Incentives system

  Deprecates the TRIBE incentives system according to proposal: 

  Specifically it:
  - Fully funds all remaining auto reward distributors via their staking token wrappers
  - Withdraws remaining TRIBE from the TribalChief, leaving enough behind to fully fund existing commitments
  - Withdraws $50k TRIBE from 3Crv Votium briber contract
  - Withdraws remaining TRIBE from Aave incentives
  - Withdraws remaining TRIBE from ERC20Dripper
  - Moves previously clawed back TRIBE from the TRIBE DAO timelock to the Core Treasury
  `
};

export default deprecate_incentives;
