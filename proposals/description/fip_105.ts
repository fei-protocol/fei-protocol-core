import { ProposalDescription } from '@custom-types/types';

const fip_105: ProposalDescription = {
  title: 'FIP-105: Grant DAI PSM skimmer PCV_CONTROLLER_ROLE',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x0866eae1216ed05a11636a648003f3f62921eb97ccb05acc30636f62958a8bd6', '{daiFixedPricePSMFeiSkimmer}'],
      description: 'Grant the new DAI PSM Skimmer the PCV_CONTROLLER_ROLE'
    }
  ],
  description: 'Configure a new Fei Skimmer to burn excess DAI from the DAI PSM'
};

export default fip_105;
