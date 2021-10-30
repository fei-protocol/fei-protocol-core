import { DependencyMap } from '@custom-types/types';

const dependencies: DependencyMap = {
  contract: {
    fips: {
      fip_10: true
    },
    contractDependencies: ['contractB'],
    externalDependencies: []
  },
  contractB: {
    fips: {
      fip_10: true
    },
    contractDependencies: ['contract'],
    externalDependencies: []
  }
};

export default dependencies;
