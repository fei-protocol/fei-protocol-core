import { ProposalCategory, ProposalsConfigMap } from '@custom-types/types';

import swap_dpi_to_dai from '@proposals/description/swap_dpi_to_dai';
// import fip_xx_proposal from '@proposals/description/fip_xx';

const proposals: ProposalsConfigMap = {
  swap_dpi_to_dai: {
    deploy: true,
    proposalId: null,
    affectedContractSignoff: ['dpi', 'compoundDaiPCVDeposit', 'dpiToDaiSwapper', 'dpiToDaiLensDai', 'dpiToDaiLensDpi'],
    deprecatedContractSignoff: [
      'rariPool31FeiPCVDepositWrapper',
      'rariPool25FeiPCVDepositWrapper',
      'rariPool9RaiPCVDepositWrapper',
      'aaveRaiPCVDepositWrapper',
      'rariPool19DpiPCVDepositWrapper',
      'liquityFusePoolLusdPCVDeposit',
      'rariPool72FeiPCVDepositWrapper',
      'raiDepositWrapper',
      'rariPool31FeiPCVDeposit',
      'rariPool25FeiPCVDeposit',
      'rariPool9RaiPCVDeposit',
      'aaveRaiPCVDeposit',
      'rariPool19DpiPCVDeposit',
      'rariPool72FeiPCVDeposit',
      'dpiDepositWrapper'
    ],
    category: ProposalCategory.DAO,
    totalValue: 0,
    proposal: swap_dpi_to_dai
  }
};

export default proposals;
