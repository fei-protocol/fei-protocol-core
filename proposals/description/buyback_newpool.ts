import { ProposalDescription } from '@custom-types/types';

const buyback_newpool: ProposalDescription = {
  title: 'Update the TRIBE buyback Balancer LBP',
  commands: [
    {
      target: 'pcvEquityMinter',
      values: '0',
      method: 'setTarget(address)',
      arguments: ['{noFeeFeiTribeLBPSwapper}'],
      description: 'Set PCV Equity Minter target to new Buyback swapper'
    },
    {
      target: 'feiTribeLBPSwapper',
      values: '0',
      method: 'exitPool(address)',
      arguments: ['{noFeeFeiTribeLBPSwapper}'],
      description: 'Exit buyback liquidity from old swapper to new swapper'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{noFeeFeiTribeLBPSwapper}', '4000000000000000000000000'],
      description: "Mint 4m FEI for missed buybacks and this week's buybacks"
    },
    {
      target: 'pcvEquityMinter',
      values: '0',
      method: 'unpause()',
      arguments: [],
      description: 'Unpause the PCV Equity Minter'
    },
    {
      target: 'noFeeFeiTribeLBPSwapper',
      values: '0',
      method: 'forceSwap()',
      arguments: [],
      description: 'Re-start the buybacks'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: ['{feiBuybackLens}', '{feiBuybackLensNoFee}'],
      description: 'Update CR oracle to inspect new buyback pool'
    }
  ],
  description: `
Balancer will soon activate protocol fees. They asked us to re-deploy the Liquidity Bootstrapping Pool that we use for TRIBE buybacks with a new factory, that won't have protocol fees, due to a potential bug with LBPs when activating protocol fees.

This proposal activates a new Balancer pool for TRIBE buybacks, replacing the old one.

The new buyback LBP also shift weights from 10% to 90%, instead of the original 1% to 99%, to reduce slippage the protocol gets on buybacks.
`
};

export default buyback_newpool;
