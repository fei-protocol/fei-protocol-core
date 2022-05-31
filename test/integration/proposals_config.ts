import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

// import fip_xx_proposal from '@proposals/description/fip_xx';s
import fip_107 from '@proposals/description/fip_107';

const proposals: ProposalsConfigMap = {
  fip_107: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: fip_107, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: null,
    affectedContractSignoff: [
      'pcvGuardianNew',
      'ohmToEthLBPSwapper',
      'aaveEthPCVDeposit',
      'collateralizationOracle',
      'ohmToETHLensOHM',
      'ohmToETHLensETH'
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default proposals;
