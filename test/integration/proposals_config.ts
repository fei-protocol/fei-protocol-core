import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';
import aura_airdrop from '@proposals/description/aura_airdrop';

const proposals: ProposalsConfigMap = {
  aura_airdrop: {
    deploy: false, // deploy flag for whether to run deploy action during e2e tests or use mainnet state
    totalValue: 0, // amount of ETH to send to DAO execution
    proposal: aura_airdrop, // full proposal file, imported from '@proposals/description/fip_xx.ts'
    proposalId: '',
    affectedContractSignoff: [],
    deprecatedContractSignoff: [],
    category: ProposalCategory.DEBUG
  }
};

export default proposals;
