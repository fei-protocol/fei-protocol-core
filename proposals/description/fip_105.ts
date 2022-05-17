import { ProposalDescription } from '@custom-types/types';

const fip_105: ProposalDescription = {
  title: 'FIP-105: Reinforce PCV by consolidating assets and performing technical maintenance',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x0866eae1216ed05a11636a648003f3f62921eb97ccb05acc30636f62958a8bd6', '{daiFixedPricePSMFeiSkimmer}'],
      description: 'Grant the new DAI PSM Skimmer the PCV_CONTROLLER_ROLE'
    },
    {
      target: 'dpi',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{dpiToDaiSwapper}', '37888449801955370645659'],
      description: 'Transfer DPI from DAO timelock to the LBP pool'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{dpiToDaiSwapper}', '187947000000000000000000'],
      description: 'Withdraw Use the PCVGuardian to transfer DAI from the CompoundPCVDeposit to the LBP pool'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{dpiToDaiLensDai}'],
      description: 'Add DAI swapper lens to the CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{dpiToDaiLensDpi}'],
      description: 'Add DPI swapper lens to the CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [
        [
          '{dpiDepositWrapper}',
          '{rariPool31FeiPCVDepositWrapper}',
          '{rariPool25FeiPCVDepositWrapper}',
          '{rariPool9RaiPCVDepositWrapper}',
          '{aaveRaiPCVDepositWrapper}',
          '{rariPool19DpiPCVDepositWrapper}',
          '{liquityFusePoolLusdPCVDeposit}',
          '{rariPool72FeiPCVDepositWrapper}',
          '{raiDepositWrapper}'
        ]
      ],
      description: 'Remove DPI Deposit wrapper from CR oracle, as now empty'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816', '{tribalCouncilTimelock}'],
      description: 'Grant TribalCouncilTimelock SWAP_ADMIN_ROLE so it can initiate the LBP swap'
    }
  ],
  description: `
  FIP-105: Reinforce PCV by consolidating assets and performing technical maintenance

  
  Transfer DPI and DAI to the LBP swapper. This will be used over the course of a month
  to swap DPI for DAI. 
  
  The DAI received will be sent to the Compound DAI deposit, where it can then be dripped to PSM.

  Configure a new Fei Skimmer to burn excess DAI from the DAI PSM
  `
};

export default fip_105;
