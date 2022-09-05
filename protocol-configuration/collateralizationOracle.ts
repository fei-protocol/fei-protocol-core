// This config lists all of the contracts that should be in the collateralization oracle
// Key names are the tokens that the contract holds / should be tracked in
// Values are arrays of contracts that hold that token

export const CollateralizationOracleConfig = {
  bal: ['balancerDepositBalWeth', 'balancerLensVeBalBal', 'balancerGaugeStaker'],
  fei: ['rariPool79FeiPCVDepositWrapper', 'rariTimelockFeiOldLens'],
  dai: ['daiFixedPricePSM', 'daiHoldingPCVDeposit'],
  lusd: ['lusdHoldingPCVDeposit'],
  weth: ['ethLidoPCVDeposit', 'balancerLensVeBalWeth']
};

export type CollateralizationOracleConfigType = typeof CollateralizationOracleConfig;
