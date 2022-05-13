import { ProposalDescription } from '@custom-types/types';

const swap_dpi_to_dai: ProposalDescription = {
  title: 'Swap DPI to DAI',
  commands: [
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
      method: 'removeDeposit(address)',
      arguments: ['{dpiDepositWrapper}'],
      description: 'Remove DPI Deposit wrapper from CR oracle, as now empty'
    }
  ],
  description: `
  Transfer DPI and DAI to the LBP swapper. This will be used over the course of a month
  to swap DPI for DAI. 
  
  The DAI received will be sent to the Compound DAI deposit, where it can then be dripped to PSM.
  `
};

export default swap_dpi_to_dai;
