import { ProposalDescription } from '@custom-types/types';

const fip_50: ProposalDescription = {
  title: 'FIP-50: Yield improvements',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816', '{optimisticTimelock}'],
      description: 'Grant SWAP_ADMIN_ROLE to the OA'
    },
    {
      target: 'feiLusdLBPSwapper',
      values: '0',
      method: 'exitPool(address)',
      arguments: ['{feiDAOTimelock}'],
      description: 'Exit all tokens from LUSD LBP Swapper'
    },
    {
      target: 'lusd',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{rariPool7LusdPCVDeposit}', '10000000000000000000000000'],
      description: 'Send 10M LUSD to pool 7'
    },
    {
      target: 'rariPool7LusdPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit LUSD to pool 7'
    },
    {
      target: 'lusd',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{bamm}', '90000000000000000000000000'],
      description: 'Approve 90M LUSD to BAMM'
    },
    {
      target: 'bamm',
      values: '0',
      method: 'deposit(uint256)',
      arguments: ['90000000000000000000000000'],
      description: 'Deposit 90M LUSD to BAMM'
    },
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{ethLidoPCVDeposit}', '12000000000000000000000'],
      description: 'Withdraw 12k ETH from Aave to Lido PCV Deposit'
    },
    {
      target: 'compoundEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{ethLidoPCVDeposit}', '12000000000000000000000'],
      description: 'Withdraw 12k ETH from Compound to Lido PCV Deposit'
    }
  ],
  description: 'Withdraw and deploy LUSD and stETH'
};

export default fip_50;
