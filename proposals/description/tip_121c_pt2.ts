import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_121c_pt2: TemplatedProposalDescription = {
  title: 'TIP_121c (pt. 2): Deprecate sub-systems',
  commands: [
    // 1. Revoke all non-final Tribe roles
    // METAGOVERNANCE roles
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), addresses.feiDAOTimelock],
      description: 'Revoke METAGOVERNANCE_VOTE_ADMIN from feiDAOTimelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), addresses.feiDAOTimelock],
      description: 'Revoke METAGOVERNANCE_TOKEN_STAKING from feiDAOTimelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'), addresses.feiDAOTimelock],
      description: 'Revoke METAGOVERNANCE_GAUGE_ADMIN from feiDAOTimelock'
    },
    // PCV_MINOR_PARAM_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.feiDAOTimelock],
      description: 'Revoke PCV_MINOR_PARAM_ROLE from feiDAOTimelock'
    },

    // 2. Deprecate PCV Sentinel
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.pcvSentinel],
      description: 'Revoke GUARDIAN_ROLE from PCV Sentinel'
    },

    // 3. Deprecate PCV Guardian
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.pcvGuardian],
      description: 'Revoke GUARDIAN_ROLE from PCV Guardian'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.pcvGuardian],
      description: 'Revoke PCV_CONTROLLER_ROLE from PCV Guardian'
    },

    // 4. Revoke veto role from NopeDAO and cancel role from podAdminGateway
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_VETO_ADMIN'), addresses.nopeDAO],
      description: 'Revoke POD_VETO_ADMIN from NopeDAO'
    },
    // Revoke ROLE_ADMIN from DAO timelock now that POD_VETO_ADMIN has been revoked
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('ROLE_ADMIN'), addresses.feiDAOTimelock],
      description: 'Revoke ROLE_ADMIN from feiDAOTimelock'
    },
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('CANCELLER_ROLE'), addresses.podAdminGateway],
      description: 'Revoke CANCELLER_ROLE from PodAdminGateway'
    },

    // 5. Deprecate ratioPCVControllerV2
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.ratioPCVControllerV2],
      description: 'Revoke PCV_CONTROLLER_ROLE from RatioPCVControllerV2'
    }
  ],
  description: `
  TIP_121c (pt. 2): Deprecate sub-systems and revoke non-final roles

  This proposal deprecates various sub-systems:
  1. PCV sentinel
  2. PCV guardian
  3. NopeDAO and associated podAdminGateway contract
  4. ratioPCVControllerV2
  `
};

export default tip_121c_pt2;
