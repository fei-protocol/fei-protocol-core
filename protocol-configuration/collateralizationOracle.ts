const collateralizationAddresses = {
  fei: [
    'feiOATimelockWrapper',
    'rariPool6FeiPCVDepositWrapper',
    'rariPool19FeiPCVDepositWrapper',
    'rariPool24FeiPCVDepositWrapper',
    'rariPool25FeiPCVDepositWrapper',
    'aaveFeiPCVDepositWrapper',
    'rariPool79FeiPCVDepositWrapper',
    'rariPool31FeiPCVDepositWrapper',
    'rariPool72FeiPCVDepositWrapper',
    'rariPool128FeiPCVDepositWrapper',
    'rariPool22FeiPCVDepositWrapper',
    'feiBuybackLensNoFee',
    'compoundFeiPCVDepositWrapper',
    'turboFusePCVDeposit'
  ],
  lusd: ['liquityFusePoolLusdPCVDeposit', 'rariPool7LusdPCVDeposit', 'bammDeposit', 'lusdPSM'],
  dai: ['compoundDaiPCVDepositWrapper', 'daiFixedPricePSM'],
  usd: ['namedStaticPCVDepositWrapper', 'd3poolCurvePCVDeposit', 'd3poolConvexPCVDeposit'],
  bal: ['balancerDepositBalWeth', 'balancerLensVeBalBal'],
  cream: ['creamDepositWrapper'],
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
    'balancerLensVeBalWeth'
  ],
  dpi: ['rariPool19DpiPCVDepositWrapper', 'dpiDepositWrapper'],
  rai: ['rariPool9RaiPCVDepositWrapper', 'aaveRaiPCVDepositWrapper', 'raiDepositWrapper', 'raiPriceBoundPSM'],
  agEUR: ['agEurDepositWrapper', 'uniswapLensAgEurUniswapGauge', 'agEurUniswapPCVDeposit'],
  volt: ['voltDepositWrapper']
};

export default collateralizationAddresses;