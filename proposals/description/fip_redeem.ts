import { ProposalDescription } from '@custom-types/types';

const fip_redeemer: ProposalDescription = {
  title: 'REPT-B Redemption',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{reptbRedeemer}', '12000000000000000000000000'],
      description: 'Mint FEI to the ReptB Redeemer'
    },
    {
      target: 'pegExchanger',
      values: '0',
      method: 'setExpirationTimestamp(uint256)',
      arguments: ['1659312000'],
      description: 'Expire peg exchanger'
    }
  ],
  description: ``
};

export default fip_redeemer;
