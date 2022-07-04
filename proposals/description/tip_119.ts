import { TemplatedProposalDescription } from '@custom-types/types';

const tip_119: TemplatedProposalDescription = {
  title: 'TIP-119: Add gOHM to Collaterisation Oracle',
  commands: [
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
      arguments: (addresses) => [addresses.gOHMPCVHoldingDeposit],
      description: 'Add the gOHM Holding PCV Deposit'
    }
  ],
  description: `
  TIP-119: Add gOHM to Collaterisation Oracle

  Register the gOHM USD oracle on the Collaterisation Oracle.

  Then register the gOHM Holding PCV Deposit.
  `
};

export default tip_119;
