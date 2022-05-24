import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import repay_fuse_bad_debt from '@proposals/description/repay_fuse_bad_debt';

const proposals: ProposalsConfigMap = {
  repay_fuse_bad_debt: {
    deploy: true, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: repay_fuse_bad_debt, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [''],
    deprecatedContractSignoff: [''],
    category: ProposalCategory.TC
  }
};

export default proposals;
