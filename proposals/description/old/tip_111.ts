import { TemplatedProposalDescription } from '@custom-types/types';

const proposal: TemplatedProposalDescription = {
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
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [
        addresses.aaveEthPCVDeposit, // pcvDeposit
        addresses.ethPSM, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all WETH from Aave to ETH PSM'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: (addresses) => [addresses.ethLidoPCVDepositOldWrapper, addresses.ethLidoPCVDeposit],
      description: 'Swap old & new Lido ETH PCVDeposits in CR Oracle'
    },
    {
      target: 'dpiToDaiLBPSwapper',
      values: '0',
      method: 'exitPool(address)',
      arguments: (addresses) => [addresses.compoundDaiPCVDeposit],
      description: 'Withdraw all DAI and DPI from LBP pool to the compoundDAIPCVDeposit (~$3.8m)'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.compoundDaiPCVDeposit, // pcvDeposit
        addresses.dpi, // token
        addresses.tribalCouncilSafe, // to
        '10000' // basisPoints, 100%
      ],
      description:
        'Withdraw all DPI from the Compound DAI PCV deposit (~$200k) to the TribalCouncil multisig, where it will be liquidated'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: (addresses) => [],
      description: 'Deposit DAI on compoundDAIPCVdeposit into Compound'
    }
  ],
  description: `TIP-111: Increase FEI Stable backing to 90-100%

This on-chain proposal will perform the following actions :
- Migrate stETH (Lido staked ETH) to a PCVDeposit where the Chainlink oracle is used to check for slippage, instead of a hardcoded 1:1 peg (the parameter for slippage check keeps the same behavior, but will tolerate a slippage vs the Chainlink oracle price, and not vs a theorhetical 1:1 peg).
- Unstake all B-70WETH-30FEI from Balancer gauge, remove FEI/WETH liquidity from Balancer, burn the FEI, and move WETH to PSM

These actions are part of TIP-111 and will allow Guardian to perform actions to defend the FEI peg and continue to increase the stable backing (percentage of stable assets in the PCV).

-------------------------------
Also contains code from FIP_104b: Withdraw all liquidity from the DPI LBP. 

This FIP cleans up and finishes elements of the PCV reinforcement process snapshotted here:
https://snapshot.fei.money/#/proposal/0x2fd5bdda0067098f6c0520fe309dfe90ca403758f0ce98c1854a00bf38999674  
and discussed here: https://tribe.fei.money/t/fip-104-fei-pcv-reinforcement-proposal/4162 .

Specifically it:
- Exits the LBP pool and withdraws all liquidity to the compound DAI deposit
- Withdraws the DPI from the deposit to the TribalCouncil multisig, using the ratioPCVController
- Deposits the DAI on the deposit into Compound
`
};

export default proposal;
