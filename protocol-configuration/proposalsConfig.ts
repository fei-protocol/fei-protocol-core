import { ProposalCategory, TemplatedProposalsConfigMap } from '@custom-types/types';
import tip_111 from '@proposals/description/tip_111';
import pod_exec_v2 from '@proposals/description/pod_exec_v2';
import deprecate_ops_timelock from '@proposals/description/deprecate_ops_timelock';

const proposals: TemplatedProposalsConfigMap = {
  tip_111: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: tip_111, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [
      /*'dpiToDaiLBPSwapper',
      'compoundDaiPCVDeposit',
      'tribalCouncilSafe',
      'ratioPCVControllerV2'*/
    ],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DAO
  },
  pod_exec_v2: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: pod_exec_v2, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  },
  deprecate_ops_timelock: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: deprecate_ops_timelock, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  }
};

export default proposals;
