// This config lists all of the contracts that (should) be hold each listed role.

export const PermissionsConfig = {
  MINTER_ROLE: ['simpleFeiDaiPSM'],
  BURNER_ROLE: [],
  GOVERN_ROLE: ['core', 'feiDAOTimelock', 'roleBastion'],
  PCV_CONTROLLER_ROLE: ['feiDAOTimelock', 'ratioPCVControllerV2', 'pcvGuardian'],
  GUARDIAN_ROLE: ['guardianMultisig', 'pcvGuardian', 'pcvSentinel'],
  ORACLE_ADMIN_ROLE: ['tribalCouncilTimelock'],
  SWAP_ADMIN_ROLE: ['pcvEquityMinter', 'tribalCouncilTimelock', 'tribalCouncilSafe'],
  BALANCER_MANAGER_ADMIN_ROLE: [],
  RATE_LIMITED_MINTER_ADMIN: [],
  PARAMETER_ADMIN: [],
  PSM_ADMIN_ROLE: ['tribalCouncilTimelock'],
  TRIBAL_CHIEF_ADMIN_ROLE: [],
  FUSE_ADMIN: ['tribalCouncilTimelock'],
  VOTIUM_ADMIN_ROLE: [],
  PCV_GUARDIAN_ADMIN_ROLE: ['tribalCouncilTimelock'],
  PCV_SAFE_MOVER_ROLE: ['tribalCouncilTimelock'],
  METAGOVERNANCE_VOTE_ADMIN: ['feiDAOTimelock', 'tribalCouncilTimelock'],
  METAGOVERNANCE_TOKEN_STAKING: ['feiDAOTimelock'],
  METAGOVERNANCE_GAUGE_ADMIN: ['feiDAOTimelock', 'tribalCouncilTimelock'],
  ROLE_ADMIN: ['feiDAOTimelock', 'tribalCouncilTimelock'],
  POD_METADATA_REGISTER_ROLE: [
    'tribalCouncilSafe',
    'tribeDev1Deployer',
    'tribeDev2Deployer',
    'tribeDev3Deployer',
    'tribeDev4Deployer'
  ],
  FEI_MINT_ADMIN: ['feiDAOTimelock', 'tribalCouncilTimelock'],
  POD_VETO_ADMIN: ['nopeDAO'],
  POD_ADMIN: ['tribalCouncilTimelock', 'podFactory'],
  PCV_MINOR_PARAM_ROLE: ['feiDAOTimelock', 'tribalCouncilTimelock'],
  TOKEMAK_DEPOSIT_ADMIN_ROLE: ['feiDAOTimelock', 'tribalCouncilTimelock']
};

export type PermissionsConfigType = typeof PermissionsConfig;
