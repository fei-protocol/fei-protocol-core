import { ProposalDescription } from '@custom-types/types';

const fip_83: ProposalDescription = {
  title: 'FIP-83: La Tribu (hiring devs from DAO)',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{laTribuTribeTimelock}', '1000000000000000000000000'],
      description: 'Send 1M TRIBE to La Tribu TRIBE Timelock'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{laTribuFeiTimelock}', '1120000000000000000000000'],
      description: 'Send 1.12M FEI to La Tribu FEI Timelock'
    }
  ],
  description: `
Forum: https://tribe.fei.money/t/fip-83-la-tribu-hiring-devs-from-a-dao-like-structure/3956 
Snapshot: https://snapshot.org/#/fei.eth/proposal/0xbad3be26475a4fc0acabf4fbea0fa86666b0b3706b0abb15ab904856700aac01

Fund 2 FEI and TRIBE token timelocks to allow @eswak to onboard 2 devs for the DAO
All funds remain as much on-chain as possible, with DAO clawback
All expenses publicly reported to the DAO

Budget:
- 80-120k FEI/year +20k buffer for expenses, per dev
- 500k TRIBE vesting over 4 years, per dev, 1 year cliff
`
};

export default fip_83;
