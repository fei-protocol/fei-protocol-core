import { TemplatedProposalDescription } from '@custom-types/types';
import { ethers } from 'ethers';

const tip_123: TemplatedProposalDescription = {
  title: 'TIP-121: Proposal for the future of the Tribe DAO',
  commands: [
    // 1. Transfer beneficiary of deprecated Rari FEI timelock to burner timelock
    {
      target: 'rariInfraFeiTimelock',
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: (addresses) => [addresses.feiTimelockBurner1],
      description: 'Set pending beneficiary of deprecated Rari Fei timelock burner to Fei burner timelock'
    },
    {
      target: 'feiTimelockBurner1',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept deprecated Rari Fei timelock beneficiary to burner'
    },

    // 2. Transfer beneficiary of deprecated Rari TRIBE timelock to burner timelock
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'delegate(address)',
      arguments: (addresses) => [ethers.constants.AddressZero],
      description: 'Delegate all voting TRIBE to the ZERO address'
    },
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: (addresses) => [addresses.tribeTimelockBurner1],
      description: 'Set pending beneficiary of deprecated Rari Tribe timelock to Tribe burner timelock'
    },
    {
      target: 'tribeTimelockBurner1',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept deprecated Rari Tribe timelock beneficiary to burner'
    },

    // 3. Transfer beneficiary of Tribe DAO delegations contract to burner TRIBE timelock
    {
      target: 'tribeDAODelegationsTimelock',
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: (addresses) => [addresses.tribeTimelockBurner2],
      description: `
        Set pending beneficiary of Tribe DAO Tribe delegations timelock to Tribe DAO delegations
        TRIBE burner timelock
      `
    },
    {
      target: 'tribeTimelockBurner2',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept deprecated Tribe DAO delegations TRIBE timelock beneficiary to burner'
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

    // 7. Renounce ownership of ProxyAdmin
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'renounceOwnership()',
      arguments: (addresses) => [],
      description: 'Renounce ownership of ProxyAdmin, transferring owner to zero address'
    },

    // 8. Transfer admin of DAO timelock to DAO timelock burner
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
TIP-121: Proposal for the future of the Tribe DAO

This is a completion of the proposal laid out in TIP-121: https://tribe.fei.money/t/tip-121-proposal-for-the-future-of-the-tribe-dao/4475 

It transitions the DAO to a governance-less state by disabling the functionality by which the DAO executes proposals. 

In addition, it disables new TRIBE minting, consolidates all DAO owned TRIBE and FEI, and revokes all roles remaining including the GOVERNOR and GUARDIAN roles. 

The only remaining roles will be the single MINTER_ROLE on the FEI to DAI peg wrapper contract and the roles Aave needs to operate the OTC contract from “TIP-121c: veBAL OTC with Aave Companies”. Both of these roles need to remain in perpetuity to maintain basic functionality.

TRIBE and FEI will continue to remain redeemable on the TribeRedeemer and SimpleFeiDaiPSM respectively if this proposal passes.
  `
};

export default tip_123;
