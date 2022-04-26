import { ProposalDescription } from '@custom-types/types';

const fip_85: ProposalDescription = {
  title: 'FIP-85: Kill RGT rewards on RGT/ETH SushiSwap pair',
  commands: [
    {
      target: 'rariGovernanceProxyAdmin',
      values: '0',
      method: 'upgrade(address,address)',

      arguments: ['{rariGovernanceTokenSushiSwapDistributor}', '0x7A2bbAe82bd08196d64Ff01c53788d942CF5F7b2'],
      description:
        'Upgrade the RariGovernanceTokenUniswapDistributor to the new implementation (cuts off rewards at block 14671500)'
    },
    {
      target: 'rariGovernanceTokenSushiSwapDistributor',
      values: '0',
      method: 'setDistributionEndBlock()',
      arguments: [],
      description: 'Set the new distribution end block'
    },
    {
      target: 'rariGovernanceTokenSushiSwapDistributor',
      values: '0',
      method: 'setDisabled(bool)',
      arguments: [true],
      description: 'Disable the RariGovernanceTokenUniswapDistributor'
    },
    {
      target: 'rariGovernanceTokenSushiSwapDistributor',
      values: '0',
      method: 'upgrade(address,uint256)',
      arguments: ['{rariTimelock}', '278386073986043863040552'],
      description:
        'Forward the remaining RGT rewards to the timelock: (568717819057309757517546 * 80 / 100) - (568717819057309757517546 * 80 / 100 * (365 + 60) / (365 * 3))'
    },
    {
      target: 'rariGovernanceTokenSushiSwapDistributor',
      values: '0',
      method: 'setDisabled(bool)',
      arguments: [false],
      description: 'Re-enable the RariGovernanceTokenUniswapDistributor'
    }
  ],
  description: "Kill RGT rewards on RGT/ETH SushiSwap pair--we don't need them anymore."
};

export default fip_85;
