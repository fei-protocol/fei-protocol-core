import { ProposalDescription } from '@custom-types/types';

const fip_87: ProposalDescription = {
  title: 'FIP-87: PCV Sentinel',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: [
        '0x55435dd261a4b9b3364963f7738a7a662ad9c84396d64be3365284bb7f0a5041', // guardian
        '{pcvSentinel}'
      ],
      description: 'Grant GUARDIAN_ROLE to Sentinel'
    }
  ],
  description: `
  Forum Discussion: https://tribe.fei.money/t/fip-87-pcv-sentinel/4018. 
  
  The PCV Sentinel will be deployed and granted the role of “GUARDIAN” (the same role as the multisig guardian. 
  The Tribe DAO authorizes the multisig guardian to add automated policies to the PCV Sentinel to protect the PCV, 
  automate key protocol features such as the PSM, the collateralization oracle, and other system-critical components.
  
  Snapshot Link: https://snapshot.fei.money/#/proposal/0x28737bde7d4c72d9bac98eab158f5f288d475456833a8bd4f151fcc3b131b6f1`
};

export default fip_87;
