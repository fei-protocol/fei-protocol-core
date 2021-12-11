import { ProposalDescription } from '@custom-types/types';

const fip_48: ProposalDescription = {
  title: 'FIP-48: Update Collateralization Oracle',
  commands: [
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracles(address[],address[])',
      arguments: [
        ['{lusd}', '{cream}', '{bal}'],
        ['{chainlinkLUSDOracle}', '{creamUsdCompositeOracle}', '{balUsdCompositeOracle}']
      ],
      description: 'Add new oracles LUSD, CREAM, BAL'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [
        [
          '{feiLusdLens}',
          '{aaveFeiPCVDepositWrapper}',
          '{creamDepositWrapper}',
          '{balDepositWrapper}',
          '{rariPool7LusdPCVDeposit}',
          '{staticPcvDepositWrapper2}',
          '{feiBuybackLens}',
          '{liquityFusePoolLusdPCVDeposit}',
          '{rariPool90FeiPCVDeposit}'
        ]
      ],
      description: 'Add new PCV Deposits'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [
        [
          '0x4E119714f625B2E82e5fB5A7E297978f020Ea51E', // G-UNI Fuse wrapper
          '0x05E2e93CFb0B53D36A3151ee727Bb581D4B918Ce', // NFTX Fuse wrapper
          '{staticPcvDepositWrapper}' // Old Static PCV deposit
        ]
      ],
      description: 'Remove PCV Deposit duplicates'
    }
  ],
  description: `
  Summary: Updates the on-chain collateralization with the most recent PCV Deposits.

  Description: 
  Adds new oracles for:
  - LUSD
  - CREAM
  - BAL

  Adds new deposits:
  - FEI-LUSD auction
  - Aave FEI deposit
  - CREAM DAO holdings (hack repayment)
  - BAL DAO holdings (treasury swap)
  - LUSD in pool 7 and 91
  - New StaticPCVDeposit (accounting INDEX + Kashi FEI etc)
  - FEI-TRIBE buybacks
  - Fuse pool 90 FEI

  Remove:
  - Old StaticPCVDeposit
  - Duplicate Fuse deposits

  Code: https://github.com/fei-protocol/fei-protocol-core/pull/332
  `
};

export default fip_48;
