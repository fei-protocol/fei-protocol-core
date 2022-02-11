export const backupOracleConfig: BackupOracleConfig = {
  daiUsdc: {
    secondsAgo: 1800, // 30 minutes (60*10*3)
    uniswapPool: '0x123'
  },
  ethUsdc: {
    secondsAgo: 600, // 10 minutes (60 * 10)
    uniswapPool: '0x123'
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
