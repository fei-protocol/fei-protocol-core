import { TemplatedProposalDescription } from '@custom-types/types';
import { ethers } from 'ethers';

const tip_123: TemplatedProposalDescription = {
  title: 'TIP_123',
  commands: [
    // 1. Transfer beneficiary of deprecated Rari FEI timelock to burner timelock
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
      description: 'Set pending beneficiary of deprecated Rari Tribe timelock to Tribe burner timelock'
    },
    {
      target: 'deprecatedRariTribeTimelockBurner',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept deprecated Rari Tribe timelock beneficiary to burner'
    },

    // 3. Transfer beneficiary of Fei Labs Tribe contract to burner TRIBE timelock
    {
      target: 'feiLabsVestingTimelock',
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: (addresses) => [addresses.feiLabsTribeBurner],
      description: 'Set pending beneficiary of Fei Labs Tribe timelock to Fei Labs Tribe burner timelock'
    },
    {
      target: 'feiLabsTribeBurner',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept deprecated Fei Labs Tribe timelock beneficiary to burner'
    },

    // 3. Deprecate TribeMinter
    {
      target: 'tribeMinter',
      values: '0',
      method: 'setAnnualMaxInflationBasisPoints(uint256)',
      arguments: (addresses) => ['1'],
      description: 'Set Tribe minter max annual inflation to the minimum of 0.01% (1 basis point)'
    },
    {
      target: 'tribeMinter',
      values: '0',
      method: 'setMinter(address)',
      arguments: (addresses) => [addresses.feiDAOTimelock],
      description: `
        Set Tribe minter address to DAO timelock. This is an intermediate step and a subsequent action
        will set the minter address to the zero address, effectively burning it (Tribe Minter doesn't allow
        setting to zero).
      `
    },
    {
      target: 'tribe',
      values: '0',
      method: 'setMinter(address)',
      arguments: (addresses) => [ethers.constants.AddressZero],
      description: 'Set Tribe minter address to the Zero address'
    },

    // 4. Revoke PCV_CONTROLLER_ROLE from the DAO
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.feiDAOTimelock],
      description: 'Revoke the PCV_CONTROLLER_ROLE from the TribeDAO timelock'
    },

    // 5. Revoke GUARDIAN role from Guardian multisig
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.guardianMultisig],
      description: 'Revoke the GUARDIAN_ROLE from the Guardian multisig'
    },

    // 6. Revoke GOVERN_ROLE from the DAO and Core
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

    // 7. Transfer admin of DAO timelock to DAO timelock burner
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
