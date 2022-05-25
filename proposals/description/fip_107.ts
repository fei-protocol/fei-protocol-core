import { ProposalDescription } from '@custom-types/types';

const fip_107: ProposalDescription = {
  title: 'FIP-107: Acquire OHM by selling $10M of ETH',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{ohmToEthLBPSwapper}'],
      description: 'Set the Ohm to ETH LBP swapper to be a guardian Safe address'
    },
    ////////    OHM LBP    ////////
    {
      target: 'ohm',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{ohmToEthLBPSwapper}', '37888449801955370645659'],
      description: 'Transfer OHM from timelock to the LBP swapper'
    },
    // Probably needs to be WETH
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{ohmToEthLBPSwapper}', '230000000000000000000000'],
      description: 'Withdraw DAI from the CompoundPCVDeposit and transfer to the LBP pool'
    },
    // Correcting the oracle needs to happen before forceSwap()
    {
      target: 'ohmToEthLBPSwapper',
      values: '0',
      method: 'forceSwap()',
      arguments: [],
      description: 'Start the auction and override the current no-op auction'
    },
