import { ProposalDescription } from '@custom-types/types';

const fip_79: ProposalDescription = {
  title: 'FIP-79: Tribe x Olympus Partnership',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{feiDAOTimelock}', '3747957360000000000000000'],
      description: 'Send 3.74M TRIBE to Fei DAO Timelock'
    },
    {
      target: 'tribe',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{ohmEscrow}', '3747957360000000000000000'],
      description: 'Approve 3.74M TRIBE to Ohm Escrow'
    },
    {
      target: 'ohmEscrow',
      values: '0',
      method: 'swap()',
      arguments: [],
      description: 'Trigger OTC Swap'
    }
  ],
  description: `
    This proposal swaps 3.74M TRIBE for 577.18 gOHM with the Olympus DAO Treasury to form a protocol partnership.

    As part of the partnership:
    * Olympus will intake FEI to Treasury.
    * Fei protocol to fill 20% portion of bond capacity
    * Olympus to be included in Tribe Turbo

    Forum: https://tribe.fei.money/t/fip-79-olympus-dao-fei-partnership/3939/21
    Snapshot: https://snapshot.org/#/fei.eth/proposal/0x8fc10a0d66829e7e78b41a72d542adf7720f92b747a083400d77656744169907
    Code: https://github.com/fei-protocol/fei-protocol-core/pull/600
`
};

export default fip_79;
