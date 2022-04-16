import { ProposalDescription } from '@custom-types/types';

const fip_97: ProposalDescription = {
  title: 'FIP-97: Seed Turbo fuse pool with 10M Fei',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'transfer',
      arguments: ['{turboFusePCVDeposit}', '10000000000000000000000000'], // 10M
      description: 'Transfer $10M FEI from optimistic timelock to the Turbo Fuse PCV deposit'
    },
    {
      target: 'turboFusePCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit ~$10M of Fei into Turbo Fuse Pool'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [['{turboFusePCVDeposit}']],
      description: 'Add new PCV Deposits to CR oracle'
    }
  ],
  description: `
  OA action to seed Turbo fuse pool with $10M Fei. Transfer $10M Fei from the OA multisig to the Turbo Fuse PCV deposit
  and then deposit. Update the collaterization oracle to include the new deposit.
  `
};

export default fip_97;
