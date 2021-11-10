import { ProposalDescription } from '@custom-types/types';

const fip_41: ProposalDescription = {
  title: 'FIP-41: LUSD Auction',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['0x3a24fea1509e1baeb2d2a7c819a191aa441825ea', '1100000000000000000000000'],
      description: 'Mint 1.1M FEI to reimburse Fei Labs'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{feiLusdLBPSwapper}', '100000000000000000000000000'],
      description: 'Mint 100M FEI to LBP swapper'
    },
    {
      target: 'feiLusdLBPSwapper',
      values: '0',
      method: 'forceSwap()',
      arguments: [],
      description: 'Trigger the auction start'
    }
  ],
  description: `

Summary:
Acquire 100M LUSD through a Balancer auction and supply to LUSD stability pool. This amount represents 8.5% of Fei PCV and 14% of LUSD total supply.
Liquity is governance-free and has multiple decentralized front-end interfaces giving it more resilience and censorship resistance. It is very aligned with Fei in relation to decentralization.

Specification:
Acquire 100M LUSD through a Balancer auction using 100M minted FEI. It is a similar process to the one used for TRIBE buybacks.
The LUSD acquired will be deployed to Liquity's Fuse pool.

Forum discussion: https://tribe.fei.money/t/fip-41-acquire-lusd-through-a-balancer-auction/3602
Snapshot: https://snapshot.org/#/fei.eth/proposal/0x0e5f05a0c51938b904d9932849251ae920403b75301f90567da9d1ed857965c3
`
};

export default fip_41;
