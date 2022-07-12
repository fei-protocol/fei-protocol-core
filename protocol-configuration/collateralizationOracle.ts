const collateralizationAddresses: CollateralizationAddressType = {
  fei: [
    'aaveFeiPCVDepositWrapper',
    'rariPool79FeiPCVDepositWrapper',
    'feiBuybackLensNoFee',
    'compoundFeiPCVDepositWrapper',
    'rariTimelockFeiOldLens',
    'tribalCouncilTimelockFeiLens'
  ],
  lusd: ['lusdHoldingPCVDeposit'],
  dai: ['compoundDaiPCVDepositWrapper', 'daiFixedPricePSM', 'ethToDaiLensDai', 'daiHoldingPCVDeposit'],
  bal: ['balancerDepositBalWeth', 'balancerLensVeBalBal', 'balancerGaugeStaker'],
  weth: [
    'ethLidoPCVDeposit',
    'balancerLensVeBalWeth',
    'ethToDaiLensEth',
    'wethHoldingPCVDeposit',
    'rocketPoolPCVDeposit'
  ],
  volt: ['voltHoldingPCVDeposit']
};

export type CollateralizationAddressType = { [key: string]: string[] };

export default collateralizationAddresses;
