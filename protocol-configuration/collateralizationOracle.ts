const collateralizationAddresses = {
  fei: [
    'feiOATimelockWrapper',
    'rariPool8FeiPCVDepositWrapper',
    'rariPool6FeiPCVDepositWrapper',
    'rariPool19FeiPCVDepositWrapper',
    'rariPool24FeiPCVDepositWrapper',
    'rariPool25FeiPCVDepositWrapper',
    'rariPool27FeiPCVDepositWrapper',
    'rariPool18FeiPCVDepositWrapper',
    'rariPool90FeiPCVDepositWrapper',
    'aaveFeiPCVDepositWrapper',
    'rariPool79FeiPCVDepositWrapper',
    'rariPool31FeiPCVDepositWrapper',
    'rariPool72FeiPCVDepositWrapper',
    'rariPool128FeiPCVDepositWrapper',
    'rariPool22FeiPCVDepositWrapper',
    'feiBuybackLensNoFee',
    'convexPoolPCVDepositWrapper',
    'compoundPCVDepositWrapper',
    'turboFusePCVDeposit'
  ],
  lusd: [
    'liquityFusePoolLusdPCVDeposit',
    'rariPool7LusdPCVDeposit',
    'bammDeposit',
    'lusdPSM',
    'rariPool8LusdPCVDeposit'
  ],
  dai: ['compoundDaiPCVDepositWrapper', 'daiFixedPricePSM', 'rariPool8DaiPCVDeposit'],
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
    'rariPool146EthPCVDeposit',
    'wethDepositWrapper',
    'balancerDepositFeiWeth',
    'balancerLensBpt30Fei70Weth',
    'balancerLensVeBalWeth'
  ],
  dpi: ['rariPool19DpiPCVDepositWrapper', 'dpiDepositWrapper'],
  rai: ['rariPool9RaiPCVDepositWrapper', 'aaveRaiPCVDepositWrapper', 'raiDepositWrapper'],
  agEUR: ['agEurDepositWrapper', 'uniswapLensAgEurUniswapGauge', 'agEurUniswapPCVDeposit']
};

export default collateralizationAddresses;
