export const permissions = {
  MINTER_ROLE: [
    'uniswapPCVDeposit',
    'feiDAOTimelock',
    'dpiUniswapPCVDeposit',
    'pcvEquityMinter',
    'collateralizationOracleKeeper',
    'optimisticMinter',
    'agEurAngleUniswapPCVDeposit',
    'daiPSM',
    'ethPSM',
    'lusdPSM',
    'balancerDepositFeiWeth'
  ],
  BURNER_ROLE: [],
  GOVERN_ROLE: ['core', 'timelock', 'feiDAOTimelock'],
  PCV_CONTROLLER_ROLE: [
    'feiDAOTimelock',
    'ratioPCVControllerV2',
    'aaveEthPCVDripController',
    'pcvGuardian',
    'daiPCVDripController',
    'lusdPCVDripController',
    'ethPSMFeiSkimmer',
    'daiPSMFeiSkimmer',
    'lusdPSMFeiSkimmer',
    'delayedPCVMoverWethUniToBal'
  ],
  GUARDIAN_ROLE: ['multisig', 'pcvGuardian'],
  ORACLE_ADMIN_ROLE: ['collateralizationOracleGuardian', 'optimisticTimelock', 'opsOptimisticTimelock'],
  SWAP_ADMIN_ROLE: ['pcvEquityMinter', 'optimisticTimelock', 'guardian'],
  BALANCER_MANAGER_ADMIN_ROLE: [],
  PSM_ADMIN_ROLE: [],
  TRIBAL_CHIEF_ADMIN_ROLE: ['optimisticTimelock', 'tribalChiefSyncV2'],
  VOTIUM_ADMIN_ROLE: ['opsOptimisticTimelock'],
  PCV_GUARDIAN_ADMIN_ROLE: ['optimisticTimelock']
};
