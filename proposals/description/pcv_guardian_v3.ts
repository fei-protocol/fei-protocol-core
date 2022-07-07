import { ethers } from 'hardhat';
import { TemplatedProposalDescription } from '@custom-types/types';

const proposal: TemplatedProposalDescription = {
  title: 'TIP-XYZ: PCV Guardian v3',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.pcvGuardianV2],
      description: 'Revoke PCV_CONTROLLER_ROLE from pcvGuardianV2'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.pcvGuardianV2],
      description: 'Revoke GUARDIAN_ROLE from pcvGuardianV2'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.pcvGuardian],
      description: 'Grant PCV_CONTROLLER_ROLE from pcvGuardianV3'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.pcvGuardian],
      description: 'Grant GUARDIAN_ROLE from pcvGuardianV3'
    },
    {
      target: 'pcvSentinel',
      values: '0',
      method: 'slay(address)',
      arguments: (addresses) => [addresses.fuseWithdrawalGuardV1],
      description: 'Slay old fuseWithdrawalGuardV1 guard'
    },
    {
      target: 'pcvSentinel',
      values: '0',
      method: 'knight(address)',
      arguments: (addresses) => [addresses.fuseWithdrawalGuard],
      description: 'Knight new fuseWithdrawalGuard guard'
    }
  ],
  description: `TODO`
};

export default proposal;
