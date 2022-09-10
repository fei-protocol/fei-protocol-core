import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';

import fip_x from '@proposals/description/fip_x';
import tip_121a_cont from '@proposals/description/tip_121a_cont';

export const ProposalsConfig: TemplatedProposalsConfigMap = {
  tip_121a_cont: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_121a_cont, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '18036114851799980901447349577553120865890239942703903286219475543748138896566',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  }
};

export default ProposalsConfig;
