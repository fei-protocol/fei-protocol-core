// This config lists all of the contracts that should be in the collateralization oracle
// Key names are the tokens that the contract holds / should be tracked in
// Values are arrays of contracts that hold that token

export const CollateralizationOracleConfig = {
  fei: ['rariTimelockFeiOldLens'],
  dai: ['simpleFeiDaiPSM', 'escrowedAaveDaiPCVDeposit']
};

export type CollateralizationOracleConfigType = typeof CollateralizationOracleConfig;
