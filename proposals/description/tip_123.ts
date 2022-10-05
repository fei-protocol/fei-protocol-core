import { TemplatedProposalDescription } from '@custom-types/types';
import { ethers } from 'ethers';

const tip_123: TemplatedProposalDescription = {
  title: 'TIP_123',
  commands: [
    // 1. Deprecate TribeMinter
    // {
    //   target: 'core',
    //   values: '0',
    //   method: 'revokeRole(bytes32,address)',
    //   arguments: (addresses) => [ethers.utils.id('GOVERN_ROLE'), addresses.feiDAOTimelock],
    //   description: 'Revoke the GOVERN_ROLE from the TribeDAO timelock'
    // },
    // 2. Transfer beneficiary of deprecated Rari FEI timelock to burner timelock
    {
      target: 'rariInfraFeiTimelock',
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: (addresses) => [addresses.deprecatedRariFeiTimelockBurner],
      description: 'Set pending beneficiary of deprecated Rari Fei timelock burner to Fei burner timelock'
    },
    {
      target: 'deprecatedRariFeiTimelockBurner',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept deprecated Rari Fei timelock beneficiary to burner'
    },

    // 2. Transfer beneficiary of deprecated Rari TRIBE timelock to burner timelock
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: (addresses) => [addresses.deprecatedRariTribeTimelockBurner],
      description: 'Set pending beneficiary of deprecated Rari Tribe timelock burner to Tribe burner timelock'
    },
    {
      target: 'deprecatedRariTribeTimelockBurner',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept deprecated Rari Tribe timelock beneficiary to burner'
    },
    // 2. Cleanup Collaterisation Oracle
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: (addresses) => [addresses.rariTimelockFeiOldLens],
      description: 'Remove Rari Infra deprecated FEI timelock lens from CR'
    },
    // 3. Revoke PCV_CONTROLLER_ROLE from the DAO
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.feiDAOTimelock],
      description: 'Revoke the PCV_CONTROLLER_ROLE from the TribeDAO timelock'
    },
    // 4. Revoke GUARDIAN role from Guardian multisig
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.guardianMultisig],
      description: 'Revoke the GUARDIAN_ROLE from the Guardian multisig'
    },
    // 5. Revoke GOVERN_ROLE from the DAO and Core
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GOVERN_ROLE'), addresses.core],
      description: 'Revoke the GOVERN_ROLE from the Core Treasury'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GOVERN_ROLE'), addresses.feiDAOTimelock],
      description: 'Revoke the GOVERN_ROLE from the TribeDAO timelock'
    },
    // 6. Transfer admin of DAO timelock to DAO timelock burner
    {
      target: 'feiDAOTimelock',
      values: '0',
      method: 'setPendingAdmin(address)',
      arguments: (addresses) => [addresses.daoTimelockBurner],
      description: 'Set pending Fei DAO timelock admin to be the DAO timelock burner'
    },
    {
      target: 'daoTimelockBurner',
      values: '0',
      method: 'acceptFeiDAOTimelockAdmin()',
      arguments: (addresses) => [],
      description: 'Accept Fei DAO timelock admin transfer to the DAO timelock burner'
    }
  ],
  description: `
  [TITLE] /n/n
  [BODY OF PROPOSAL] \n\n
  `
};

export default tip_123;
