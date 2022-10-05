// This config lists all of the contracts that (should) be hold each listed role.

export const PermissionsConfig = {
  MINTER_ROLE: ['simpleFeiDaiPSM'],
  GOVERN_ROLE: ['core', 'feiDAOTimelock'],
  PCV_CONTROLLER_ROLE: ['feiDAOTimelock', 'vebalOtcHelper'],
  GUARDIAN_ROLE: ['guardianMultisig'],
  METAGOVERNANCE_VOTE_ADMIN: ['vebalOtcHelper'],
  METAGOVERNANCE_TOKEN_STAKING: ['vebalOtcHelper'],
  METAGOVERNANCE_GAUGE_ADMIN: ['vebalOtcHelper'],
  ROLE_ADMIN: [],
  POD_VETO_ADMIN: [],
  PCV_MINOR_PARAM_ROLE: [],
  TRIBE_MINTER_ROLE: [],
  BURNER_ROLE: [],
  ORACLE_ADMIN_ROLE: [],
  SWAP_ADMIN_ROLE: [],
  BALANCER_MANAGER_ADMIN_ROLE: [],
  RATE_LIMITED_MINTER_ADMIN: [],
  PARAMETER_ADMIN: [],
  PSM_ADMIN_ROLE: [],
  TRIBAL_CHIEF_ADMIN_ROLE: [],
  FUSE_ADMIN: [],
  VOTIUM_ADMIN_ROLE: [],
  PCV_GUARDIAN_ADMIN_ROLE: [],
  PCV_SAFE_MOVER_ROLE: [],
  POD_METADATA_REGISTER_ROLE: [],
  FEI_MINT_ADMIN: [],
  POD_ADMIN: [],
  TOKEMAK_DEPOSIT_ADMIN_ROLE: []
};

export type PermissionsConfigType = typeof PermissionsConfig;
