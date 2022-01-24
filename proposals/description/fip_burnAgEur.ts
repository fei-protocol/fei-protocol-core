import { ProposalDescription } from '@custom-types/types';

const fip_73: ProposalDescription = {
  title: 'FIP-73: Burn 8.7M agEUR to redeem 10M FEI',
  commands: [
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: ['{agEurAngleUniswapPCVDeposit}', '{agEurBurner}', '10000'],
      description: 'Pull all agEUR out of Uniswap, to be burned'
    }
  ],
  description: 'Burn 8.7M agEUR to redeem 10M FEI, and burn the FEI.'
};

export default fip_73;
