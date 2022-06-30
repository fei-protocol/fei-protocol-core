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
  lusd: ['lusdHoldingPCVDeposit'],
  dai: ['compoundDaiPCVDepositWrapper', 'daiFixedPricePSM', 'ethToDaiLensDai', 'daiHoldingPCVDeposit'],
  bal: ['balancerDepositBalWeth', 'balancerLensVeBalBal', 'balancerGaugeStaker'],
  weth: ['ethLidoPCVDeposit', 'balancerLensVeBalWeth', 'ethToDaiLensEth', 'wethHoldingPCVDeposit'],
  agEUR: ['uniswapLensAgEurUniswapGauge', 'agEurUniswapPCVDeposit'],
  volt: ['voltHoldingPCVDeposit']
};

export type CollateralizationAddressType = { [key: string]: string[] };

export default collateralizationAddresses;
