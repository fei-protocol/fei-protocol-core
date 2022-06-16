import { TemplatedProposalDescription } from '@custom-types/types';

const tokemak_withdraw: TemplatedProposalDescription = {
  title: 'Withdraw from Tokemak',
  commands: [
    {
      target: 'ethTokemakPCVDeposit',
      values: '0',
      method: 'requestWithdrawal(uint256)',
      arguments: (addresses) => ['10000000000000000000000'],
      description: 'Request to withdraw 10K WETH from Tokemak in the next cycle'
    }
  ],
  description: `
  FIP 111: Request withdrawal from Tokemak

  Request a withdrawal of 10k ETH from Tokemak in the next cycle.
  `
};

export default tokemak_withdraw;
