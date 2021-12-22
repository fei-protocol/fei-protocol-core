export const permissions = {
  MINTER_ROLE: [
    'bondingCurve',
    'uniswapPCVDeposit',
    'feiDAOTimelock',
    'daiBondingCurve',
    'dpiUniswapPCVDeposit',
    'pcvEquityMinter',
    'collateralizationOracleKeeper',
    'optimisticMinter',
    'agEurAngleUniswapPCVDeposit',
    'tribeRagequit',
    'daiPSM'
  ],
  BURNER_ROLE: ['ethReserveStabilizer'],
  GOVERN_ROLE: ['core', 'timelock', 'feiDAOTimelock'],
  PCV_CONTROLLER_ROLE: [
    'feiDAOTimelock',
    'ratioPCVController',
    'aaveEthPCVDripController',
    'compoundEthPCVDripController',
    'pcvGuardian',
    'daiPCVDripController'
  ],
  GUARDIAN_ROLE: ['multisig', 'pcvGuardian'],
  ORACLE_ADMIN_ROLE: ['collateralizationOracleGuardian', 'optimisticTimelock'],
  SWAP_ADMIN_ROLE: ['pcvEquityMinter'],
  BALANCER_MANAGER_ADMIN_ROLE: [],
  PSM_ADMIN_ROLE: [],
  TRIBAL_CHIEF_ADMIN_ROLE: ['optimisticTimelock']
};
