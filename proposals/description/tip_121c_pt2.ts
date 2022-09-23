import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_121c_pt2: TemplatedProposalDescription = {
  title: 'TIP_121c (pt. 2): Deprecate sub-systems and revoke non-final roles',
  commands: [
    // 1. Revoke all non-final Tribe roles
    // SWAP_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('SWAP_ADMIN_ROLE'), addresses.pcvEquityMinter],
      description: 'Revoke SWAP_ADMIN_ROLE from pcvEquityMinter'
    },
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
    // ROLE_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('ROLE_ADMIN'), addresses.feiDAOTimelock],
      description: 'Revoke ROLE_ADMIN from feiDAOTimelock'
    },
    // 2. Deprecate Tribe Minter
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
    // 3. Deprecate Tribe Reserve Stabiliser
    {
      target: 'tribeReserveStabilizer',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause Tribe Reserve Stabilizer, prevent exchangeFei() being called'
    }
  ],
  description: `
  TIP_121c (pt. 2): Deprecate sub-systems and revoke non-final roles

  This proposal deprecates various sub-systems and revokes all non-final roles. 
  
  It also:
  1. Deprecates the TribeMinter, by settling the max inflation rate to effectively 0% and transferring
     the minter role to the zero address
  2. Deprecate TribeReserveStabilizer, by pausing the contract
  `
};

export default tip_121c_pt2;
