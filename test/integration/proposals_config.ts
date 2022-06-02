import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import repay_fuse_bad_debt from '@proposals/description/repay_fuse_bad_debt';
import register_proposal from '@proposals/description/register_proposal';
import end_tribe_incentives from '@proposals/description/end_tribe_incentives';

const proposals: ProposalsConfigMap = {
  register_proposal: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: register_proposal, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['core'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  },
  repay_fuse_bad_debt: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: repay_fuse_bad_debt, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['core', 'fuseFixer', 'pcvGuardianNew'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  },
  end_tribe_incentives: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: end_tribe_incentives, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['core', 'tribalChief', 'tribalCouncilTimelock', 'collateralizationOracle'],
    deprecatedContractSignoff: [
      'creamDepositWrapper',
      'fei3CrvAutoRewardsDistributor',
      'd3AutoRewardsDistributor',
      'autoRewardsDistributor',
      'feiDaiAutoRewardsDistributor',
      'feiUsdcAutoRewardsDistributor'
    ],
    category: ProposalCategory.TC
  }
};

export default proposals;
