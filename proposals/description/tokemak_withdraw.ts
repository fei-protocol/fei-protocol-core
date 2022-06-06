import { ProposalDescription } from '@custom-types/types';

const tokemak_withdraw: ProposalDescription = {
  title: 'Withdraw from Tokemak',
  commands: [
    {
      target: 'ethTokemakPCVDeposit',
      values: '0',
      method: 'requestWithdrawal()',
      arguments: [],
      description: 'Request to withdraw tWETH from Tokemak in the next cycle'
    }
  ],
  description: `Request to withdraw ETH from Tokemak in the next cycle`
};

export default tokemak_withdraw;
