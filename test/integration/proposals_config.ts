import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';
import fip_97 from '@proposals/description/fip_97';
import fip_92 from '@proposals/description/fip_92';

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
  fip_97: {
    deploy: true,
    proposalId: null,
    affectedContractSignoff: ['turboFusePCVDeposit'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.OA,
    totalValue: 0,
    proposal: fip_97
  },
  fip_92: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_92, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [
      'ratioPCVControllerV2',
      'balancerDepositFeiWeth',
      'balancerDepositBalWeth',
      'veBalDelegatorPCVDeposit',
      'balancerLensBpt30Fei70Weth',
      'balancerLensVeBalBal',
      'balancerLensVeBalWeth',
      'collateralizationOracle',
      'pcvGuardian'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default proposals;
