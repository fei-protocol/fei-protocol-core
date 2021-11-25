import { ProposalDescription } from '@custom-types/types';

const ido_liquidity_removal_proposal: ProposalDescription = {
  title: 'FIP-X: IDO Liquidity Removal',
  commands: [
    {
      target: '0x7D809969f6A04777F0A87FF94B57E56078E5fE0F', // remove magic address, change to import
      values: '0',
      method: 'acceptBeneficiary(address)',
      arguments: ['{feiDAOTimelock}'],
      description: 'Accept beneficiary for Fei Labs IDO Timelock (Uni-LP)'
    },
    {
      target: '0x7D809969f6A04777F0A87FF94B57E56078E5fE0F', // remove magic address, change to import
      values: '0',
      method: 'releaseMax(address)',
      arguments: [],
      description: 'Call releaseMax on IDO timelock to Fei Labs Multisig'
    },
    {
      target: '0x7D809969f6A04777F0A87FF94B57E56078E5fE0F', // remove magic address, change to import
      values: '0',
      method: 'unlockLiquidity()',
      arguments: [],
      description: 'Call unlockLiquidity on Fei Labs IDO Timelock'
    },
    {
      target: '0x7D809969f6A04777F0A87FF94B57E56078E5fE0F', // remove magic address, change to import
      values: '0',
      method: 'releaseMax(address)',
      arguments: ['{liquidityRemovalHelper}'],
      description: 'Call releaseMax on IDO timelock to intermediary helper contract'
    },
    {
      target: 'liquidityRemovalHelper',
      values: '0',
      method: 'doLiquidityTransfer()',
      arguments: [],
      description: 'Call doLiquidityTransfer on helper contract to transfer liquidity to new timelocks'
    },
    {
      target: '0x7D809969f6A04777F0A87FF94B57E56078E5fE0F', // remove magic address, change to import,
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: ['0xB8f482539F2d3Ae2C9ea6076894df36D1f632775'], // remove magic address, change to import
      description: 'Set pending beneficiary on old timelock back to guardian multisig'
    }
  ],
  description: 'Remove FEI Labs Liquidity from Uniswap and move to timelocks with identical timelock state.'
};

export default ido_liquidity_removal_proposal;
