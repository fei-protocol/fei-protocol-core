import { ProposalDescription } from '@custom-types/types';

const clawback: ProposalDescription = {
  title: 'FIP-x: Rari vesting end',
  commands: [
    {
      target: 'lipstoneVesting',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: [],
      description: 'Accept the beneficiary of the TRIBE DAO Timelock on the Jack Lipstone TRIBE vesting contract'
    },
    {
      target: 'newRariInfraFeiTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: [],
      description: 'Accept the beneficiary of the new Rari Infra FEI vesting contract'
    },
    {
      target: 'newRariInfraTribeTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: [],
      description: 'Accept the beneficiary of the new Rari infra TRIBE vesting contract'
    }
  ],
  description: `
  FIP-X: End Rari team member vesting and reconfigure

  This proposal will end the vesting of some Rari team members and reconfigure various vesting timelocks.
  `
};

export default clawback;
