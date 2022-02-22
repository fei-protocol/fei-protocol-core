import { ProposalDescription } from '@custom-types/types';

const fip_79: ProposalDescription = {
  title: 'FIP-79: PSM Backup oracles',
  commands: [
    {
      target: 'daiFixedPricePSM',
      values: '0',
      method: 'setBackupOracle',
      arguments: ['{daiUsdcTwapOracle}'],
      description: 'Set backup oracle on DAI PSM, to a UniswapV3 TWAP oracle'
    },
    {
      target: 'ethPSM',
      values: '0',
      method: 'setBackupOracle',
      arguments: ['{ethUsdcTwapOracle}'],
      description: 'Set backup oracle on ETH PSM, to a UniswapV3 TWAP oracle'
    }
  ],
  description: 'Set UniswapV3 TWAP oracles as the backup oracles for Peg Stability Modules'
};

export default fip_79;
