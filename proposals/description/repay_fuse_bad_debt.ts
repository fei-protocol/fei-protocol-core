import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'Repay Fuse Bad Debt',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{fuseFixer}'],
      description: 'Set FuseFixer as a safe address'
    }
  ],
  description: 'Set FuseFixer as a safe address'
};

export default fip_x;

/*const fip_x: ProposalDescription = {
  title: 'Repay Fuse Bad Debt',
  commands: [
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repayAll()',
      arguments: [],
      description: 'Repay all bad debt in Fuse pools 8, 18, 27, 127, 144, 146, 156'
    }
  ],
  description: 'Repay all bad debt in Fuse pools 8, 18, 27, 127, 144, 146, 156'
};

    /*
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repay(address,uint256)',
      arguments: ['0x0000000000000000000000000000000000000000', '6500000000000000000000'],
      description: 'Repay ETH'
    },
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repay(address,uint256)',
      arguments: ['0x956F47F50A910163D8BF957Cf5846D573E7f87CA', '21000000000000000000000000'],
      description: 'Repay FEI'
    },
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repay(address,uint256)',
      arguments: ['0x853d955aCEf822Db058eb8505911ED77F175b99e', '14000000000000000000000000'],
      description: 'Repay FRAX'
    },
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repay(address,uint256)',
      arguments: ['0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919', '32000000000000000000000'],
      description: 'Repay RAI'
    },
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repay(address,uint256)',
      arguments: ['0x6B175474E89094C44Da98b954EedeAC495271d0F', '15000000000000000000000000'],
      description: 'Repay DAI'
    },
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repay(address,uint256)',
      arguments: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '11000000000000'],
      description: 'Repay USDC'
    },
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repay(address,uint256)',
      arguments: ['0x5f98805A4E8be255a32880FDeC7F6728C6568bA0', '2000000000000000000000000'],
      description: 'Repay LUSD'
    },
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repay(address,uint256)',
      arguments: ['0xa693B19d2931d498c5B318dF961919BB4aee87a5', '3000000000000'],
      description: 'Repay USTw'
    },
    {
      target: 'fuseFixer',
      values: '0',
      method: 'repay(address,uint256)',
      arguments: ['0xdAC17F958D2ee523a2206206994597C13D831ec7', '150000000000'],
      description: 'Repay USDT'
    }*/
