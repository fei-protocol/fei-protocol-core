import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'FIP-85: Kill RGT rewards on RGT/ETH SushiSwap pair',
  commands: [
    {
      target: '0x1c9aA54a013962C2444ECae06902F31D532c6AD3',
      values: '0',
      method: 'upgrade(address,address)',
      arguments: ["0x1fa69a416bcf8572577d3949b742fbb0a9cd98c7", "0x4650a83520be4f1e4cee726fdd169d37cea80525"],
      description: 'Upgrade the RariGovernanceTokenUniswapDistributor to the new implementation (cuts off rewards at block 14476500)'
    },
    {
      target: '0x1fa69a416bcf8572577d3949b742fbb0a9cd98c7',
      values: '0',
      method: 'setDisabled(bool)',
      arguments: [true],
      description: 'Disable the RariGovernanceTokenUniswapDistributor'
    },
    {
      target: '0x1fa69a416bcf8572577d3949b742fbb0a9cd98c7',
      values: '0',
      method: 'upgrade(address,uint256)',
      arguments: ["0x8ace03fc45139fddba944c6a4082b604041d19fc", "404594685886433151695132"],
      description: 'Forward the remaining RGT rewards to the timelock: 568717819057309757517546 - (568717819057309757517546 * 80 / 100 * (365 + 30) / (365 * 3))'
    },
    {
      target: '0x1fa69a416bcf8572577d3949b742fbb0a9cd98c7',
      values: '0',
      method: 'setDisabled(bool)',
      arguments: [false],
      description: 'Re-enable the RariGovernanceTokenUniswapDistributor'
    }
  ],
  description: 'Kill RGT rewards on RGT/ETH SushiSwap pair--we don\'t need them anymore.'
};

export default fip_x;
