import { ProposalDescription } from '@custom-types/types';

const tokemak_withdraw: ProposalDescription = {
  title: 'Withdraw from Tokemak',
  commands: [
    {
      target: 'ethTokemakPCVDeposit',
      values: '0',
      method: 'requestWithdrawal(uint256)',
      arguments: ['10000000000000000000000'],
      description: 'Request to withdraw WETH from Tokemak in the next cycle'
    }
    // TODO: Claim TOKE rewards as part of this
  ],
  description: `Request to withdraw ETH from Tokemak in the next cycle`
};

export default tokemak_withdraw;
