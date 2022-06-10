import { TemplatedProposalDescription } from '@custom-types/types';

const clawback: TemplatedProposalDescription = {
  title: 'FIP-x: Rari vesting end',
  commands: [
    /////////  Mint FEI and TRIBE onto new RARI timelocks
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: (addresses) => [addresses.newRariInfraFeiTimelock, '3254306506849315068493151'],
      description: 'Mint FEI to the new Rari Infra FEI timelock'
    },

    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: (addresses) => [addresses.newRariInfraTribeTimelock, '3254296867072552004058854'],
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
    }
  ],
  description: `
  FIP-X: End Rari team member vesting and reconfigure

  This proposal will clawback the vesting TRIBE of Jai Bhavnani and David Lucidend.
  
  It also migrates the Rari infrastructure timelock to a new timelock which has the DAO timelock as the clawback admin. 
  In addition, it sets accepts the beneficiary of the old RARI timelocks as the DAO timelock.
  `
};

export default clawback;
