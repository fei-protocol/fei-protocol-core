import { ProposalDescription } from '@custom-types/types';

const fip_107: ProposalDescription = {
  title: 'FIP-107: Acquire OHM by selling $10M of ETH',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{ethTogOhmLBPSwapper}'],
      description: 'Set the ETH to gOHM LBP swapper to be a guardian Safe address'
    },
    ////////    gOHM LBP    ////////
    {
      target: 'gohm',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{ethTogOhmLBPSwapper}', '180000000000000000000'],
      description: 'Transfer gOHM from timelock to the LBP swapper'
    },
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: ['{aaveEthPCVDeposit}', '{ethTogOhmLBPSwapper}', '5109000000000000000000', false, false],
      description: 'Withdraw WETH from the Aave ETH PCV deposit, using the pcvGuardian, and transfer to the LBP swapper'
    },
    // TODO: Figure out why can't add gOhmToETHLensgOHM to the oracle
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [['{gOhmToETHLensETH}']],
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
    }
  ],
  description: `
  FIP-107: Acquire gOHM by selling $10M of ETH

  This FIP implements the OHM acquisition that was approved in this snapshot:
  https://snapshot.fei.money/#/proposal/0xae1d98ac263411666ae3e054669b787d1632264449d3bf09a17d5c027d650d90
  and discussed in this forum post: https://tribe.fei.money/t/fip-xx-tribe-acquires-ohm/4287 

  Specifically, it creates a Balancer LBP between ETH and gOHM. The weights are set to 5% (OHM)
  and 95% (ETH) and the pool is seeded with $10M of ETH and $550k of OHM

  In addition, the FIP performs technical maintenance tasks:
  - Removes the now empty CREAM PCV deposit from the collaterisation oracle
  `
};

export default fip_107;
