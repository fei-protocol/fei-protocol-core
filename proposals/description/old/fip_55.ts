import { ProposalDescription } from '@custom-types/types';

const fip_55: ProposalDescription = {
  title: 'FIP-55: PCV Guardian',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantGuardian(address)',
      arguments: ['{pcvGuardian}'],
      description: 'Grant PCV Guardian GUARDIAN_ROLE'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{pcvGuardian}'],
      description: 'Grant PCV Guardian PCV_CONTROLLER_ROLE'
    }
  ],
  description: `
  Create a PCV Guardian which can move PCV only to safe locations, namely other PCV deposits that are particularly low risk.

  This would help save assets in the event of a hack or extreme market conditions if Fei Protocol has a heads up.

  Code: https://github.com/fei-protocol/fei-protocol-core/pull/353
  Discussion: https://tribe.fei.money/t/fip-55-pcv-guardian/3744 
`
};

export default fip_55;
