import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';
import fip_98 from '@proposals/description/fip_98';

const proposals: ProposalsConfigMap = {
  /*
    fip_xx: {
      deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
      totalValue: 0, // amount of ETH to send to DAO execution
      proposal: fip_xx, // full proposal file, imported from '@proposals/description/fip_xx.ts'
      proposalId: '',
      affectedContractSignoff: [''],
      deprecatedContractSignoff: [''],
      category: ProposalCategory.DAO
    }
    */
  fip_98: {
    deploy: false,
    proposalId: '47738997083165992958921925097327638388915944734650384828020246684763693471048',
    affectedContractSignoff: [
      'fei',
      'voltFeiSwapContract',
      'feiDAOTimelock',
      'collateralizationOracle',
      'voltDepositWrapper',
      'voltOracle',
      'volt',
      'turboFusePCVDeposit',
      'pcvGuardian'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: fip_98
  }
};

export default proposals;
