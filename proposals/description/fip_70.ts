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
      target: 'uniswapPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{balancerDepositFeiWeth}', '20000000000000000000000'],
      description: 'Withdraw 20,000 ETH from Uniswap to Balancer FEI pair'
    },
    {
      target: 'balancerDepositFeiWeth',
      values: '0',
      method: 'wrapETH()',
      arguments: [],
      description: 'Wrap 20,000 ETH to WETH for deposit on Balancer'
    },
    {
      target: 'balancerDepositFeiWeth',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit 20,000 WETH on Balancer with matching FEI'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{delayedPCVMoverWethUniToBal}'],
      description: 'Grant PCV_CONTROLLER_ROLE to the DelayedPCVMover for 2nd half of migration'
    }
  ],
  description: ``
};

export default fip_70;
