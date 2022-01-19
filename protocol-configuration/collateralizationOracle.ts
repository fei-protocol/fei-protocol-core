const collateralizationAddresses = {
  fei: [
    'feiOATimelockWrapper',
    'rariPool8FeiPCVDepositWrapper',
    'rariPool9FeiPCVDepositWrapper',
    'rariPool7FeiPCVDepositWrapper',
    'rariPool6FeiPCVDepositWrapper',
    'rariPool19FeiPCVDepositWrapper',
    'rariPool24FeiPCVDepositWrapper',
    'rariPool25FeiPCVDepositWrapper',
    'rariPool26FeiPCVDepositWrapper',
    'rariPool27FeiPCVDepositWrapper',
    'rariPool18FeiPCVDepositWrapper',
    'rariPool90FeiPCVDeposit',
    'aaveFeiPCVDepositWrapper',
    'rariPool91FeiPCVDeposit',
    'rariPool79FeiPCVDeposit',
    'rariPool28FeiPCVDeposit',
    'rariPool31FeiPCVDeposit',
    'rariPool72FeiPCVDeposit',
    'feiBuybackLensNoFee'
  ],
  lusd: ['liquityFusePoolLusdPCVDeposit', 'rariPool7LusdPCVDeposit', 'bammDeposit', 'lusdPSM'],
  dai: ['compoundDaiPCVDepositWrapper', 'daiPSM'],
  usd: ['namedStaticPCVDepositWrapper', 'd3poolCurvePCVDeposit', 'd3poolConvexPCVDeposit'],
  bal: ['balancerDepositBalWeth'],
  cream: ['creamDepositWrapper'],
  weth: [
    'ethLidoPCVDepositWrapper',
    'compoundEthPCVDepositWrapper',
    'aaveEthPCVDepositWrapper',
    'uniswapPCVDeposit',
    'ethTokemakPCVDeposit',
    'ethPSM',
    'rariPool146EthPCVDeposit'
  ],
  dpi: ['dpiUniswapPCVDeposit', 'rariPool19DpiPCVDepositWrapper'],
  rai: ['rariPool9RaiPCVDepositWrapper', 'aaveRaiPCVDepositWrapper'],
  agEUR: ['agEurAngleUniswapPCVDeposit']
};

export default collateralizationAddresses;
