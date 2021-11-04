import { DependencyMap } from '@custom-types/types';
import permanently_revoke_burner from '@proposals/description/permanently_revoke_burner';

const dependencies: DependencyMap = {
  core: {
    fips: {
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  fei: {
    fips: {
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  pcvEquityMinter: {
    fips: {
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  collateralizationOracleKeeper: {
    fips: {
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  feiTribeLBPSwapper: {
    fips: {
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  collateralizationOracle: {
    fips: {
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  collateralizationOracleWrapper: {
    fips: {
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  collateralizationOracleGuardian: {
    fips: {
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  optimisticTimelock: {
    fips: {
      fip_37: true,
      permanently_revoke_burner: false
    },
    contractDependencies: [],
    externalDependencies: []
  },
  restrictedPermissions: {
    fips: {
      fip_37: false,
      permanently_revoke_burner: true
    },
    contractDependencies: [],
    externalDependencies: []
  }
};

export default dependencies;
