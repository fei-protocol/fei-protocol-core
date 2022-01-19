import { ProposalDescription } from '@custom-types/types';

const merger: ProposalDescription = {
  title: 'FIP-51: FeiRari Merger',
  commands: [
    {
      target: 'mergerGate',
      values: '0',
      method: 'floop()',
      arguments: [],
      description: 'Ensure Rari DAO Passed'
    },
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{pegExchangerDripper}', '170000000000000000000000000'],
      description: 'Seed Peg Exchanger Dripper with 170m TRIBE'
    },
    {
      target: 'core',
      values: '0',
      method: 'allocateTribe(address,uint256)',
      arguments: ['{pegExchanger}', '100000000000000000000000000'],
      description: 'Seed Peg Exchanger with 100m TRIBE'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{tribeRagequit}'],
      description: 'Grant Tribe Ragequit Minter'
    },
    {
      target: 'pegExchanger',
      values: '0',
      method: 'tribeAccept()',
      arguments: [],
      description: 'Tribe Accept PegExchanger'
    },
    {
      target: 'tribeRagequit',
      values: '0',
      method: 'tribeAccept()',
      arguments: [],
      description: 'Tribe Accept TribeRageQuit'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{gfxAddress}', '315909060000000000000000'],
      description: 'Send 315k FEI to GFX'
    }
  ],
  description: `
  This proposal represents the Tribe half of the FeiRari merger code. It executes the following steps:
  0. Check Rari vote executed first
  1. Accept PegExchanger contract for swapping RGT to TRIBE at ~26.7 TRIBE per RGT exchange rate
  2. Accept TRIBERagequit contract
  3. Seed PegExchangerDripper with 170m TRIBE
  4. Seed PegExchanger with 100m TRIBE
  5. Grant FEI minting to TRIBERagequit
  6. Send 315k FEI to GFX

  Ragequit details:
  - live until unix epoch 1640480400: Dec 26, 1am UTC
  - Intrinsic Value: $1.078903938

  Rari forum: https://forums.rari.capital/d/177-feirari-token-merge/56
  Tribe forum: https://tribe.fei.money/t/fip-51-fei-rari-token-merge/3642/105
  Code: https://github.com/fei-protocol/fei-protocol-core/tree/develop/contracts/merger
`
};

export default merger;
