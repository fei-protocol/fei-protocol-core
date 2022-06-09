const collateralizationAddresses: CollateralizationAddressType = {
  fei: [
    'feiOATimelockWrapper',
    'rariPool6FeiPCVDepositWrapper',
    'rariPool19FeiPCVDepositWrapper',
    'rariPool24FeiPCVDepositWrapper',
    'aaveFeiPCVDepositWrapper',
    'rariPool79FeiPCVDepositWrapper',
    'rariPool128FeiPCVDepositWrapper',
    'rariPool22FeiPCVDepositWrapper',
    'feiBuybackLensNoFee',
    'compoundFeiPCVDepositWrapper',
    'turboFusePCVDeposit'
  ],
  lusd: ['rariPool7LusdPCVDeposit', 'bammDeposit', 'lusdPSM'],
  dai: ['compoundDaiPCVDepositWrapper', 'daiFixedPricePSM', 'dpiToDaiLensDai', 'ethToDaiLensDai'],
  usd: ['namedStaticPCVDepositWrapper', 'd3poolCurvePCVDeposit', 'd3poolConvexPCVDeposit'],
  bal: ['balancerDepositBalWeth', 'balancerLensVeBalBal', 'balancerGaugeStaker'],
  weth: [
    'ethLidoPCVDepositWrapper',
    'compoundEthPCVDepositWrapper',
    'aaveEthPCVDepositWrapper',
    'uniswapPCVDeposit',
    'ethTokemakPCVDeposit',
    'ethPSM',
    'wethDepositWrapper',
    'balancerDepositFeiWeth',
    'balancerLensBpt30Fei70Weth',
    'balancerLensVeBalWeth',
    'ethToDaiLensEth'
  ],
  dpi: ['dpiToDaiLensDpi'],
  rai: ['raiPriceBoundPSM'],
  agEUR: ['agEurDepositWrapper', 'uniswapLensAgEurUniswapGauge', 'agEurUniswapPCVDeposit'],
  volt: ['voltDepositWrapper']
};

export type CollateralizationAddressType = { [key: string]: string[] };

export default collateralizationAddresses;
