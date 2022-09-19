import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';
import tip_121b from '@proposals/description/tip_121b';
import tip_121c from '@proposals/description/tip_121c';
import tip_auraotc from '@proposals/description/tip_auraotc';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  tip_121b: {
    deploy: false,
    totalValue: 0,
    proposal: tip_121b,
    proposalId: '18409504155893955395764219200342193055990239653098975117323864343432865890837',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  },
  tip_121c: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_121c, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  },
  tip_auraotc: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_auraotc, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '40494215678183079926634175176986219126439592295510157269103853910881682985593',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default ProposalsConfig;
