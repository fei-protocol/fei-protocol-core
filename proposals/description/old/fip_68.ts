import { ProposalDescription } from '@custom-types/types';

const fip_68: ProposalDescription = {
  title: 'FIP-68: REPT-B Redemption and RGT Migration Future Expiry',
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
  description: `
  This proposal allows all REPT-B to redeem for FEI at 1:1.

  It also triggers the RGT->TRIBE expiry for August 1, 2022 (unix epoch 1659312000).
  `
};

export default fip_68;
