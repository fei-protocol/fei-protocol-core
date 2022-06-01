import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import repay_fuse_bad_debt from '@proposals/description/repay_fuse_bad_debt';
import curve_swap_stables from '@proposals/description/curve_swap_stables';

const proposals: ProposalsConfigMap = {
  repay_fuse_bad_debt: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: repay_fuse_bad_debt, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: ['core', 'fuseFixer', 'pcvGuardianNew'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  },
  curve_swap_stables: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: curve_swap_stables, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: null,
    affectedContractSignoff: ['pcvGuardianNew', 'compoundDaiPCVDeposit', 'tribalCouncilTimelock'],
    deprecatedContractSignoff: [],
    category: ProposalCategory.TC
  }
};

export default proposals;
