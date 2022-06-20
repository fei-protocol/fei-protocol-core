import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';
import tip_111 from '@proposals/description/tip_111';
import cr_oracle_cleanup from '@proposals/description/cr_oracle_cleanup';
import pod_exec_v2 from '@proposals/description/pod_exec_v2';
import tokemak_withdraw from '@proposals/description/tokemak_withdraw';
import tip_112 from '@proposals/description/tip_112';

const proposals: TemplatedProposalsConfigMap = {
  cr_oracle_cleanup: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: cr_oracle_cleanup, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  },
  tip_112: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_112, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['core', 'fuseFixer', 'pcvGuardianNew'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  },
  tokemak_withdraw: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tokemak_withdraw, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['ethTokemakPCVDeposit'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  },
  pod_exec_v2: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: pod_exec_v2, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  }
};

export default proposals;
