import { ProposalDescription } from '@custom-types/types';

const clawback: ProposalDescription = {
  title: 'FIP-x: Rari vesting end',
  commands: [
    /////   Accept beneficiary of old timelocks
    {
      target: 'lipstoneVesting',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: [],
      description: 'Accept the beneficiary of the TRIBE DAO Timelock on the Jack Lipstone TRIBE vesting contract'
    },
    {
      target: 'rariInfraFeiTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: [],
      description:
        'Accept the beneficiary of the old Rari Infra FEI vesting contract. Will allow the DAO to claim these funds.'
    },
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: [],
      description:
        'Accept the beneficiary of the new Rari infra TRIBE vesting contract. Will allow the DAO to claim these funds.'
    },

    /////////  Mint FEI and TRIBE onto newly migrated RARI timelocks
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{newRariInfraFeiTimelock}', '3254306506849315068493151'],
      description: 'Mint FEI to the new Rari Infra FEI timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{newRariInfraTribeTimelock}', '3254296867072552004058854'],
      description: 'Allocate TRIBE to the new Rari Infra TRIBE timelock'
    },

    ////  Clawbacks
    {
      target: 'clawbackVestingContractA',
      values: '0',
      method: 'clawback()',
      arguments: [],
      description: 'Clawback the TRIBE of Jai Bhavnani and David Lucid'
    },
    {
      target: 'clawbackVestingContractB',
      values: '0',
      method: 'clawback()',
      arguments: [],
      description: 'Clawback the TRIBE of Jai Bhavnani and David Lucid'
    },
    {
      target: 'clawbackVestingContractC',
      values: '0',
      method: 'clawback()',
      arguments: [],
      description: 'Clawback the TRIBE of Jai Bhavnani and David Lucid'
    }
  ],
  description: `
  FIP-X: End Rari team member vesting and reconfigure

  This proposal will clawback the vesting TRIBE of Jai Bhavnani and David Lucidend.
  
  It also migrates the Rari infrastructure timelock and Jack Lipstone's timelock and sets the pending beneficiary
  to the TRIBE DAO timelock
  `
};

export default clawback;
