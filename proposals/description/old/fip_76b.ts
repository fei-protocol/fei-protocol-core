import { ProposalDescription } from '@custom-types/types';

const fip_76b: ProposalDescription = {
  title: 'FIP-76b: Add LUSD to FeiRari',
  commands: [
    {
      target: 'delayedPCVMoverWethUniToBal',
      values: '0',
      method: 'unpause()',
      arguments: [],
      description: 'Unpause FEI/WETH delayed PCVMover'
    },
    {
      target: 'delayedPCVMoverWethUniToBal',
      values: '0',
      method: 'withdrawRatio()',
      arguments: [],
      description: 'Finish migration of FEI/WETH to Balancer'
    },
    {
      target: 'balancerDepositFeiWeth',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit WETH in Balancer'
    },
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{uniswapPCVDeposit}', '400000000000000000000'],
      description: 'Send 400 WETH to Uniswap PCVDeposit'
    },
    {
      target: 'uniswapPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit ~2M$ of liquidity in Uniswap'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{rariPool8DaiPCVDeposit}', '5000000000000000000000000'],
      description: 'Move 5M DAI to FeiRari'
    },
    {
      target: 'rariPool8DaiPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit 5M DAI in FeiRari'
    },
    {
      target: 'bammDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{rariPool8LusdPCVDeposit}', '5000000000000000000000000'],
      description: 'Move 5M LUSD to FeiRari'
    },
    {
      target: 'rariPool8LusdPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit 5M LUSD in FeiRari'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: ['{dpiUniswapPCVDeposit}', '{feiDAOTimelock}', '10000'],
      description: 'Withdraw all remaining DPI/FEI liquidity from Sushiswap'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [
        [
          '{rariPool7FeiPCVDepositWrapper}', // Fuse pool 7 UpOnly is now empty
          '{rariPool9FeiPCVDepositWrapper}', // Fuse pool 9 FRAX is now empty
          '{rariPool26FeiPCVDepositWrapper}', // Fuse pool 26 Tokemak is now empty
          '{rariPool28FeiPCVDepositWrapper}', // Fuse pool 28 G-UNI is now empty
          '{rariPool91FeiPCVDepositWrapper}', // Fuse pool 91 Liquity is now empty
          '{dpiUniswapPCVDeposit}' // DPI/FEI Sushiswap deposit is now empty
        ]
      ],
      description: 'Cleanup: Remove PCV Deposit that are empty'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [['{rariPool8DaiPCVDeposit}', '{rariPool8LusdPCVDeposit}']],
      description: 'Add new PCV Deposits to CR oracle'
    },
    {
      target: 'votiumBriber3Crvpool',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: ['0x2d46c62aa6fbc9b550f22e00476aebb90f4ea69cd492a68db4d444217763330d'], // keccak256("VOTIUM_ADMIN_ROLE")
      description: 'Set Votium 3crv-fei Briber Admin'
    }
  ],
  description: `
The OA Multisig has been used to add LUSD on FeiRari. This DAO proposal executes the 2nd half of FIP-76:
- Seed 5M DAI in FeiRari
- Seed 5M LUSD in FeiRari

Also includes some technical maintenance tasks :
- Finish FEI/ETH migration to Balancer
- Seed 400 ETH on Uniswap FEI/ETH pool to keep ~2M$ of liquidity on Uniswap (required for Compound)
- Remove remaining DPI on Sushiswap & send to DAO Timelock
- Remove unused PCVDeposits from CR oracle
- Set VOTIUM_ADMIN_ROLE as the role for fei-3crv briber (bribes are currently not working for this pool)
`
};

export default fip_76b;
