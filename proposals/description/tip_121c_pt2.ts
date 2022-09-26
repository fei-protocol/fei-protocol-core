import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_121c_pt2: TemplatedProposalDescription = {
  title: 'TIP_121c (pt. 2): Deprecate sub-systems',
  commands: [
    // 1. Deprecate PCV Sentinel
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.pcvSentinel],
      description: 'Revoke GUARDIAN_ROLE from PCV Sentinel'
    },

    // 2. Deprecate PCV Guardian
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

    // 3. Revoke veto role from NopeDAO and cancel role from podAdminGateway
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_VETO_ADMIN'), addresses.nopeDAO],
      description: 'Revoke POD_VETO_ADMIN from NopeDAO'
    },
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('CANCELLER_ROLE'), addresses.podAdminGateway],
      description: 'Revoke CANCELLER_ROLE from PodAdminGateway'
    },

    // 4. Deprecate ratioPCVControllerV2
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
