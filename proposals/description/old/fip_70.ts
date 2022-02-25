import { ProposalDescription } from '@custom-types/types';

const fip_70: ProposalDescription = {
  title: 'FIP-70: ETH/FEI Liquidity migration to Balancer',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{balancerDepositFeiWeth}'],
      description: 'Grant FEI/WETH Pool deposit the FEI_MINTER_ROLE role'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [['{balancerDepositFeiWeth}']],
      description: 'Add Balancer WETH/FEI deposit to CR oracle'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: ['{uniswapPCVDeposit}', '{balancerDepositFeiWeth}', '5000'],
      description: 'Withdraw half ETH from Uniswap to Balancer FEI pair'
    },
    {
      target: 'balancerDepositFeiWeth',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit WETH on Balancer with matching FEI'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{delayedPCVMoverWethUniToBal}'],
      description: 'Grant PCV_CONTROLLER_ROLE to the DelayedPCVMover for 2nd half of migration'
    }
  ],
  description: `
Forum discussion: https://tribe.fei.money/t/fip-70-lets-get-balsy/3752/10
Snapshot: https://snapshot.org/#/fei.eth/proposal/0x15fe70617a8a1b09021bc007ddd4264f7129196bb57eb37866af3d73292b3019

Move Uniswap-v2 FEI-ETH liquidity to Balancer, in a 70% WETH / 30% FEI pool.

Half of the liquidity will be migrated instantly, the 2nd half on Thu Feb 03 2022 15:13:20 GMT-0800 (PT).
`
};

export default fip_70;
