import { ProposalDescription } from '@custom-types/types';

const fip_73b: ProposalDescription = {
  title: 'FIP-73b: Contractionary Monetary Policy',
  commands: [
    {
      target: 'barnbridgeAFei',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{bbRedeemer}', '492668479380329562859341'],
      description: 'Send bbAFei to redeemer'
    },
    {
      target: 'idleBestYield',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{idleRedeemer}', '2479763984581322867398616'],
      description: 'Send idle best yield to redeemer'
    },
    {
      target: 'idleTranches',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{idleTranchesRedeemer}', '500000000000000000000000'],
      description: 'Send idle tranches to redeemer'
    },
    {
      target: 'kashiFeiDPI',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{kashiRedeemer}', '1000000000000000000000000'],
      description: 'Send Kashi FEI-DPI to redeemer'
    },
    {
      target: 'kashiFeiEth',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{kashiRedeemer}', '2500000000000000000000000'],
      description: 'Send Kashi FEI-ETH to redeemer'
    },
    {
      target: 'kashiFeiTribe',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{kashiRedeemer}', '2500000000000000000000000'],
      description: 'Send Kashi FEI-TRIBE to redeemer'
    },
    {
      target: 'kashiFeiXSushi',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{kashiRedeemer}', '2500000000000000000000000'],
      description: 'Send Kashi FEI-xSUSHI to redeemer'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: ['9'],
      description: 'Remove Kashi ETH'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: ['8'],
      description: 'Remove Kashi TRIBE'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: ['7'],
      description: 'Remove Kashi SUSHI'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: ['6'],
      description: 'Remove Kashi DPI'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: ['3'],
      description: 'Remove idle best yield'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: ['2'],
      description: 'Remove barnbridge'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: ['1'],
      description: 'Remove Visor'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: ['0'],
      description: 'Remove idle senior'
    }
  ],
  description: ``
};

export default fip_73b;
