import { DependencyMap } from '@custom-types/types';

const dependencies: DependencyMap = {
  core: {
    fips: {
      lusd_swap_grant_swapper_role: true,
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  fei: {
    fips: {
      lusd_swap_grant_swapper_role: false,
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  pcvEquityMinter: {
    fips: {
      lusd_swap_grant_swapper_role: false,
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  collateralizationOracleKeeper: {
    fips: {
      lusd_swap_grant_swapper_role: false,
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  feiTribeLBPSwapper: {
    fips: {
      lusd_swap_grant_swapper_role: false,
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  collateralizationOracle: {
    fips: {
      lusd_swap_grant_swapper_role: false,
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  collateralizationOracleWrapper: {
    fips: {
      lusd_swap_grant_swapper_role: false,
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  collateralizationOracleGuardian: {
    fips: {
      lusd_swap_grant_swapper_role: false,
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  optimisticTimelock: {
    fips: {
      lusd_swap_grant_swapper_role: true,
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  restrictedPermissions: {
    fips: {
      lusd_swap_grant_swapper_role: false,
      fip_37: false,
      permanently_revoke_burner: true
    },
    contractDependencies: [],
    externalDependencies: []
  },
  feiLusdLBPSwapper: {
    fips: {
      lusd_swap_grant_swapper_role: true,
      fip_37: false,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  }
};

export default dependencies;
