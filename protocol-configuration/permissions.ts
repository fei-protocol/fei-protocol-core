export const permissions = {
  MINTER_ROLE: [
    'uniswapPCVDeposit',
    'feiDAOTimelock',
    'dpiUniswapPCVDeposit',
    'pcvEquityMinter',
    'collateralizationOracleKeeper',
    'optimisticMinter',
    'daiFixedPricePSM',
    'ethPSM',
    'lusdPSM',
    'balancerDepositFeiWeth',
    'globalRateLimitedMinter'
  ],
  BURNER_ROLE: [],
  GOVERN_ROLE: ['core', 'feiDAOTimelock'],
  PCV_CONTROLLER_ROLE: [
    'feiDAOTimelock',
    'ratioPCVControllerV2',
    'aaveEthPCVDripController',
    'pcvGuardian',
    'daiPCVDripController',
    'lusdPCVDripController',
    'ethPSMFeiSkimmer',
    'lusdPSMFeiSkimmer',
    'raiPriceBoundPSM'
  ],
  GUARDIAN_ROLE: ['multisig', 'pcvGuardian', 'pcvSentinel'],
  ORACLE_ADMIN_ROLE: ['collateralizationOracleGuardian', 'optimisticTimelock', 'opsOptimisticTimelock'],
  SWAP_ADMIN_ROLE: ['pcvEquityMinter', 'optimisticTimelock'],
  BALANCER_MANAGER_ADMIN_ROLE: [],
  PSM_ADMIN_ROLE: [],
  TRIBAL_CHIEF_ADMIN_ROLE: ['optimisticTimelock', 'tribalChiefSyncV2'],
  VOTIUM_ADMIN_ROLE: ['opsOptimisticTimelock'],
  PCV_GUARDIAN_ADMIN_ROLE: ['optimisticTimelock'],
  METAGOVERNANCE_VOTE_ADMIN: ['feiDAOTimelock', 'opsOptimisticTimelock'],
  METAGOVERNANCE_TOKEN_STAKING: ['feiDAOTimelock', 'opsOptimisticTimelock'],
  METAGOVERNANCE_GAUGE_ADMIN: ['feiDAOTimelock', 'optimisticTimelock']
};
