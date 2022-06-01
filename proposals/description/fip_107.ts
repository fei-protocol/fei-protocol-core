import { ProposalDescription } from '@custom-types/types';

const fip_107: ProposalDescription = {
  title: 'FIP-107: Acquire OHM by selling $10M of ETH',
  commands: [
    {
      target: 'gohm',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{ethTogOhmLBPSwapper}', '263000000000000000000'],
      description: 'Transfer gOHM from timelock to the LBP swapper'
    },
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{ethTogOhmLBPSwapper}', '5410000000000000000000'],
      description: 'Withdraw WETH from the Aave ETH PCV deposit and transfer to the LBP swapper'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: ['{gohm}', '{gOhmUSDOracle}'],
      description: 'Set the gOHM USD oracle on the Collaterisation Oracle in order to add the lens'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [['{gOhmToETHLensETH}', '{gOhmToETHLensgOHM}']],
      description: 'Add gOHM and ETH swapper lenses to the CR oracle'
    },
    {
      target: 'ethTogOhmLBPSwapper',
      values: '0',
      method: 'forceSwap()',
      arguments: [],
      description: 'Start the auction and override the current no-op auction'
    },
    // Technical maintenance
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: ['{creamDepositWrapper}'],
      description: 'Remove empty CREAM deposit from the CR oracle'
    },
    {
      target: 'gohm',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{tribalCouncilTimelock}', '314180000000000000000'],
      description: 'Send remainder of the DAO gOHM to the Tribal Council timelock'
    }
  ],
  description: `
  FIP-107: Acquire gOHM by selling $10M of ETH

  This FIP implements the OHM acquisition that was approved in this snapshot:
  https://snapshot.fei.money/#/proposal/0xae1d98ac263411666ae3e054669b787d1632264449d3bf09a17d5c027d650d90
  and discussed in this forum post: https://tribe.fei.money/t/fip-xx-tribe-acquires-ohm/4287 

  Specifically, it creates a Balancer LBP between ETH and gOHM. The weights are set to 5% (gOHM)
  and 95% (ETH) and the pool is seeded with $10.5M of ETH and $784k of gOHM

  In addition, the FIP performs technical maintenance tasks:
  - Removes the now empty CREAM PCV deposit from the collaterisation oracle
  - Sends the remainder of the DAO gOHM, ~$942k, to the Tribal Council timelock
  `
};

export default fip_107;
