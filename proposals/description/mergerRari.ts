import { ProposalDescription } from '@custom-types/types';

const merger: ProposalDescription = {
  title: 'FIP-51: FeiRari Merger',
  commands: [
    {
      target: 'pegExchanger',
      values: '0',
      method: 'rgtAccept()',
      arguments: [],
      description: 'RGT Accept PegExchanger'
    },
    {
      target: 'tribeRagequit',
      values: '0',
      method: 'rgtAccept()',
      arguments: [],
      description: 'RGT Accept TribeRageQuit'
    },
    {
      target: 'rariTimelock',
      values: '0',
      method: 'setPendingAdmin(address)',
      arguments: ['{tribeRariDAO}'],
      description: 'Set TRIBE DAO to admin of RGT Timelock'
    },
    {
      target: 'tribeRariDAO',
      values: '0',
      method: '__acceptAdmin()',
      arguments: [],
      description: 'Accept Admin on Tribe Rari DAO'
    }
  ],
  description: `
  This proposal represents the Rari half of the FeiRari merger code. It executes the following steps:
  1. Accept PegExchanger contract for swapping RGT to TRIBE at ~26.7 TRIBE per RGT exchange rate
  2. Accept TRIBERagequit contract
  3. Set Pending Admin of Rari DAO Timelock to TribeRariDAO (a GovernorBravo governed by TRIBE)
  4. Accept Admin of the Rari DAO Timelock by TribeRariDAO

  Rari forum: https://forums.rari.capital/d/177-feirari-token-merge/56
  Tribe forum: https://tribe.fei.money/t/fip-51-fei-rari-token-merge/3642/105
  Code: https://github.com/fei-protocol/fei-protocol-core/tree/develop/contracts/merger
`
};

export default merger;
