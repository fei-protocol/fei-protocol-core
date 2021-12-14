import { ProposalDescription } from '@custom-types/types';

const fip_50: ProposalDescription = {
  title: 'FIP-50: Yield improvements',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{ratioPCVControllerV2}'],
      description: 'Grant PCV Controller to RatioPCVControllerV2'
    },
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
      arguments: ['{ratioPCVControllerV2}', '1000000000000000000000000000'],
      description: 'Approve 1bn LUSD to RarioPCVControllerV2'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'transferFromRatio(uint256)',
      arguments: ['{lusd}', '{feiDAOTimelock}', '{bammDeposit}', '10000'],
      description: 'Withdraw all LUSD to BAMMDeposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawUnwrapWETH(address,address,uint256)',
      arguments: ['{aaveEthPCVDeposit}', '{ethLidoPCVDeposit}', '12000000000000000000000'],
      description: 'Withdraw 12k WETH from Aave and send as ETH to Lido'
    },
    {
      target: 'compoundEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{ethLidoPCVDeposit}', '12000000000000000000000'],
      description: 'Withdraw 12k ETH from Compound to Lido PCV Deposit'
    },
    {
      target: 'ethLidoPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit to Lido PCV Deposit'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [['{feiLusdLens}']],
      description: 'Remove Old PCV Deposits from Collateralization Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [['{bammDeposit}']],
      description: 'Add New PCV Deposits to Collateralization Oracle'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokePCVController(address)',
      arguments: ['{ratioPCVController}'],
      description: 'Revoke PCV Controller from RatioPCVController'
    }
  ],
  description: 'Withdraw and deploy LUSD and stETH'
};

export default fip_50;
