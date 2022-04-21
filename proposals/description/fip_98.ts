import { ProposalDescription } from '@custom-types/types';

const fip_97: ProposalDescription = {
  title: 'FIP-98: Purchase 10m VOLT',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'mint',
      arguments: ['{feiDAOTimelock}', '10170000000000000000000000'], // 10.17M
      description: 'Mint $10.17M FEI'
    },
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{voltFeiSwapContract}', '10170000000000000000000000'],
      description: 'Approve 10.17m Fei to be spent by the otc contract on the timelocks behalf'
    },
    {
      target: 'voltFeiSwapContract',
      values: '0',
      method: 'swap()',
      arguments: [],
      description: 'Swap fei for Volt'
    }
  ],
  description: `Swap 10.17m Fei for 10m VOLT as described in fip 88 https://tribe.fei.money/t/fip-88-volt-joins-the-tribe/4007`
};

export default fip_97;
