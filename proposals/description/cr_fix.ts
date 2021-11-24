import { ProposalDescription } from '@custom-types/types';

const cr_fix: ProposalDescription = {
  title: 'CR-FIX',
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
          '{staticPcvDepositWrapper2}'
          // TODO rariPool 91 LUSD PCV Deposit
          // TODO rariPool 90 FEI PCV Deposit
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
  description: `desc`
};

export default cr_fix;
