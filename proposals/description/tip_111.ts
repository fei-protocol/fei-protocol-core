import { TemplatedProposalDescription } from '@custom-types/types';

const eth_lbp: TemplatedProposalDescription = {
  title: 'TIP-111: Increase FEI Stable backing to 90-100%',
  commands: [
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.ethLidoPCVDepositOld, // pcvDeposit
        addresses.steth, // token
        addresses.ethLidoPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate all stETH to new PCVDeposit'
    },
    {
      target: 'balancerGaugeStaker',
      values: '0',
      method: 'unstakeFromGauge(address,uint256)',
      arguments: (addresses) => [
        addresses.bpt30Fei70Weth, // token
        '252865858892972812879565' // amount
      ],
      description: 'Unstake all B-70WETH-30FEI from Balancer gauge'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.balancerGaugeStaker, // pcvDeposit
        addresses.bpt30Fei70Weth, // token
        addresses.balancerDepositFeiWeth, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all B-70WETH-30FEI to Balancer deposit'
    },
    {
      target: 'balancerDepositFeiWeth',
      values: '0',
      method: 'exitPool(address)',
      arguments: (addresses) => [addresses.balancerDepositFeiWeth],
      description: 'Exit LP position and send WETH to self, while burning the FEI'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.balancerDepositFeiWeth, // pcvDeposit
        addresses.weth, // token
        addresses.aaveEthPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all WETH to Aave PCVDeposit'
    },
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: () => [],
      description: 'Deposit all WETH in Aave'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: (addresses) => [addresses.ethLidoPCVDepositOldWrapper, addresses.ethLidoPCVDeposit],
      description: 'Swap old & new Lido ETH PCVDeposits in CR Oracle'
    }
  ],
  description: `
This on-chain perform will perform the following actions :
- Migrate stETH (Lido staked ETH) to a PCVDeposit where the Chainlink oracle is used to check for slippage, instead of a hardcoded 1:1 peg (the parameter for slippage check keeps the same behavior, but will tolerate a slippage vs the Chainlink oracle price, and not vs a theorhetical 1:1 peg).
- Unstake all B-70WETH-30FEI from Balancer gauge, remove FEI/WETH liquidity from Balancer, burn the FEI, and move WETH to Aave (where it can be dripped to the PSMs or moved by the Guardian)

These actions are part of TIP-111 and will allow Guardian to perform actions to defend the FEI peg and continue to increase the stable backing (percentage of stable assets in the PCV).
`
};

export default eth_lbp;
