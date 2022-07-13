import { ethers } from 'hardhat';
import { TemplatedProposalDescription } from '@custom-types/types';

const proposal: TemplatedProposalDescription = {
  title: 'TIP-120: PCV Guardian v3',
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
      description: 'Grant PCV_CONTROLLER_ROLE to pcvGuardianV3'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.pcvGuardian],
      description: 'Grant GUARDIAN_ROLE to pcvGuardianV3'
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
  description: `TIP-120: PCV Guardian v3

PCV Guardian v3 adds features that allow moving a percentage of the funds held by the PCV Deposits. This is useful for the Tribal Council when executing proposals if the amounts of tokens are not known in advance. This capability was existing for the DAO Timelock, but not for the Tribal Council. This proposal does not allow movements of funds to new addresses and does not increase the responsibilities of any role. This proposal also upgrades the Fuse Withdrawal Guard to use the new PCV Guardian v3 to keep this feature active.
`
};

export default proposal;
