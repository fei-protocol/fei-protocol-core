import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';
import tip_121a from '@proposals/description/tip_121a';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  tip_121a: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_121a, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '39342228769990539577850858055862613427527095004175636100227557913556282521482',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};
