const collateralizationAddresses: CollateralizationAddressType = {
  fei: [
    'feiOATimelockWrapper',
    'aaveFeiPCVDepositWrapper',
    'rariPool79FeiPCVDepositWrapper',
    'rariPool128FeiPCVDepositWrapper',
    'rariPool22FeiPCVDepositWrapper',
    'feiBuybackLensNoFee',
    'compoundFeiPCVDepositWrapper',
    'turboFusePCVDeposit'
  ],
  lusd: ['lusdPSM'],
  dai: ['compoundDaiPCVDepositWrapper', 'daiFixedPricePSM', 'ethToDaiLensDai'],
  usd: ['namedStaticPCVDepositWrapper'],
  bal: ['balancerDepositBalWeth', 'balancerLensVeBalBal', 'balancerGaugeStaker'],
  weth: [
    'ethLidoPCVDeposit',
    'aaveEthPCVDepositWrapper',
    'ethPSM',
    'balancerDepositFeiWeth',
    'balancerLensBpt30Fei70Weth',
    'balancerLensVeBalWeth',
    'ethToDaiLensEth'
  ],
  agEUR: ['uniswapLensAgEurUniswapGauge', 'agEurUniswapPCVDeposit'],
  volt: ['voltDepositWrapper']
};

export type CollateralizationAddressType = { [key: string]: string[] };

export default collateralizationAddresses;
