import { TemplatedProposalDescription } from '@custom-types/types';

const eth_lbp: TemplatedProposalDescription = {
  title: 'TODO',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: (addresses) => [addresses.ethLidoPCVDeposit],
      description: 'Set the new ethLidoPCVDeposit as guardian Safe addresses'
    },
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'unsetSafeAddress(address)',
      arguments: (addresses) => [addresses.ethLidoPCVDepositOld],
      description: 'Unset the old ethLidoPCVDeposit as guardian Safe addresses'
    },
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
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: (addresses) => [addresses.ethLidoPCVDepositOld, addresses.ethLidoPCVDeposit],
      description: 'Swap old & new Lido ETH PCVDeposits'
    }
  ],
  description: `
  TODO
  `
};

export default eth_lbp;
