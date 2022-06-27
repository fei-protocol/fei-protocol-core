const collateralizationAddresses: CollateralizationAddressType = {
  fei: [
    'feiOATimelockWrapper',
    'aaveFeiPCVDepositWrapper',
    'rariPool79FeiPCVDepositWrapper',
    'rariPool128FeiPCVDepositWrapper',
    'rariPool22FeiPCVDepositWrapper',
    'feiBuybackLensNoFee',
    'compoundFeiPCVDepositWrapper',
    'turboFusePCVDeposit',
    'rariTimelockFeiOldLens',
    'tribalCouncilTimelockFeiLens'
  ],
  lusd: ['lusdPSM', 'lusdHoldingDeposit'],
  dai: ['compoundDaiPCVDepositWrapper', 'daiFixedPricePSM', 'ethToDaiLensDai', 'daiHoldingDeposit'],
  bal: ['balancerDepositBalWeth', 'balancerLensVeBalBal', 'balancerGaugeStaker'],
  weth: [
    'ethLidoPCVDeposit',
    'ethPSM',
    'balancerLensVeBalWeth',
    'ethToDaiLensEth',
    'aaveEthPCVDepositWrapper',
    'wethHoldingDeposit'
  ],
  agEUR: ['uniswapLensAgEurUniswapGauge', 'agEurUniswapPCVDeposit'],
  volt: ['voltDepositWrapper', 'voltHoldingDeposit'],
  rai: ['raiHoldingDeposit']
};

export type CollateralizationAddressType = { [key: string]: string[] };

export default collateralizationAddresses;
