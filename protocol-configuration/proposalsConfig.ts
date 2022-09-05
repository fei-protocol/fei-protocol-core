import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';
import tip_121b from '@proposals/description/tip_121b';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  tip_121b: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_121b, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DEBUG
  }
};

export default ProposalsConfig;
