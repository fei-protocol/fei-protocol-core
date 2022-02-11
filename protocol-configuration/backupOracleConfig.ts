export const backupOracleConfig: BackupOracleConfig = {
  daiUsdc: {
    secondsAgo: 1800, // 30 minutes (60*10*3)
    uniswapPool: '0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168' // TODO: Check
  },
  ethUsdc: {
    secondsAgo: 600, // 10 minutes (60 * 10)
    uniswapPool: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8' // TODO: Check + may need inverting
  }
};

export type BackupOracleConfig = {
  daiUsdc: {
    secondsAgo: number;
    uniswapPool: string;
  };
  ethUsdc: {
    secondsAgo: number;
    uniswapPool: string;
  };
};
