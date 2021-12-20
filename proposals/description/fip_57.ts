import { ProposalDescription } from '@custom-types/types';

const fip_57: ProposalDescription = {
  title: 'FIP-57: Add NamedPCVDepositWrapper to the Collateralization Oracle',
  commands: [
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: ['{staticPcvDepositWrapper2}'],
      description: 'Remove staticPcvDepositWrapper2 from CR Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{namedStaticPCVDepositWrapper}'],
      description: 'Add namedStaticPCVDepositWrapper to CR Oracle'
    }
  ],
  description: `
Summary:
This proposal adds the NamedPCVDepositWrapper to the Collateralization Oracle
`
};

export default fip_57;
