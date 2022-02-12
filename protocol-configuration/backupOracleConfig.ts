export const daiUsdcBackupOracleConfig: BackupOracleConfig = {
  twapPeriod: 1800, // 30 minutes
  minTwapPeriod: 60, // 1 minute
  maxTwapPeriod: 86400, // 1 day
  minPoolLiquidity: 50e6, // 50m
  uniswapPool: '0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168' // TODO: Check
};

export const ethUsdcBackupOracleConfig: BackupOracleConfig = {
  twapPeriod: 1800, // 30 minutes
  minTwapPeriod: 1800, // 30 minutes
  maxTwapPeriod: 172800, // 2 days
  minPoolLiquidity: 50e6, // 50m
  uniswapPool: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8' // TODO: Check + may need inverting
};

export type BackupOracleConfig = {
  twapPeriod: number;
  minTwapPeriod: number;
  maxTwapPeriod: number;
  minPoolLiquidity: number;
  uniswapPool: string;
};
