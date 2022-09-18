import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Timelock roles
const TC_PROPOSER_ROLE = ethers.utils.id('PROPOSER_ROLE');
const TC_CANCELLER_ROLE = ethers.utils.id('CANCELLER_ROLE');
const TC_EXECUTOR_ROLE = ethers.utils.id('EXECUTOR_ROLE');
const TC_TIMELOCK_ADMIN_ROLE = ethers.utils.id('TIMELOCK_ADMIN_ROLE');

const tip_121a_pt2: TemplatedProposalDescription = {
  title: 'TIP_123: Deprecate Optimistic Governance and the Tribal Council',
  commands: [
    // 1. Grant TIMELOCK_ADMIN_ROLE to the DAO
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [TC_TIMELOCK_ADMIN_ROLE, addresses.feiDAOTimelock],
      description: 'Grant TIMELOCK_ADMIN_ROLE to the DAO timelock'
    },
    // 2. Revoke all Tribe governance roles from the optimistic governance system
    // POD_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_ADMIN'), addresses.tribalCouncilTimelock],
      description: 'Revoke POD_ADMIN from the TC timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_ADMIN'), addresses.podFactory],
      description: 'Revoke POD_ADMIN from the Pod Factory'
    },
    // PCV_MINOR_PARAM_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_MINOR_PARAM_ROLE'), addresses.tribalCouncilTimelock],
      description: 'Revoke PCV_MINOR_PARAM_ROLE from the TC timelock'
    },
    // FEI_MINT_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('FEI_MINT_ADMIN'), addresses.tribalCouncilTimelock],
      description: 'Revoke FEI_MINT_ADMIN from the TC timelock'
    },
    // POD_METADATA_REGISTER_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_METADATA_REGISTER_ROLE'), addresses.tribeDev1Deployer],
      description: 'Revoke POD_METADATA_REGISTER_ROLE from the Tribe Dev 1'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_METADATA_REGISTER_ROLE'), addresses.tribeDev2Deployer],
      description: 'Revoke POD_METADATA_REGISTER_ROLE from the Tribe Dev 2'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_METADATA_REGISTER_ROLE'), addresses.tribeDev3Deployer],
      description: 'Revoke POD_METADATA_REGISTER_ROLE from the Tribe Dev 3'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_METADATA_REGISTER_ROLE'), addresses.tribeDev4Deployer],
      description: 'Revoke POD_METADATA_REGISTER_ROLE from the Tribe Dev 4'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_METADATA_REGISTER_ROLE'), addresses.tribalCouncilSafe],
      description: 'Revoke POD_METADATA_REGISTER_ROLE from the Tribal Council Safe'
    },
    // METAGOVERNANCE_GAUGE_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'), addresses.tribalCouncilTimelock],
      description: 'Revoke METAGOVERNANCE_GAUGE_ADMIN from the Tribal Council timelock'
    },
    // METAGOVERNANCE_VOTE_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), addresses.tribalCouncilTimelock],
      description: 'Revoke METAGOVERNANCE_VOTE_ADMIN from the Tribal Council timelock'
    },
    // PCV_SAFE_MOVER_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_SAFE_MOVER_ROLE'), addresses.tribalCouncilTimelock],
      description: 'Revoke PCV_SAFE_MOVER_ROLE from the Tribal Council timelock'
    },
    // PCV_GUARDIAN_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'), addresses.tribalCouncilTimelock],
      description: 'Revoke PCV_GUARDIAN_ADMIN_ROLE from the Tribal Council timelock'
    },
    // FUSE_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('FUSE_ADMIN'), addresses.tribalCouncilTimelock],
      description: 'Revoke FUSE_ADMIN from the Tribal Council timelock'
    },
    // PSM_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PSM_ADMIN_ROLE'), addresses.tribalCouncilTimelock],
      description: 'Revoke PSM_ADMIN_ROLE from the Tribal Council timelock'
    },
    // SWAP_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('SWAP_ADMIN_ROLE'), addresses.tribalCouncilTimelock],
      description: 'Revoke SWAP_ADMIN_ROLE from the Tribal Council timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('SWAP_ADMIN_ROLE'), addresses.tribalCouncilSafe],
      description: 'Revoke SWAP_ADMIN_ROLE from the Tribal Council Safe'
    },
    // ORACLE_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('ORACLE_ADMIN_ROLE'), addresses.tribalCouncilTimelock],
      description: 'Revoke ORACLE_ADMIN_ROLE from the Tribal Council timelock'
    },
    // 3. Revoke CANCELLERS, PROPOSERS, EXECUTORS and TIMELOCK_ADMINS
    // Not revoking CANCELLER from the podAdminGateway, so the NopeDAO can still Nope
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [TC_PROPOSER_ROLE, addresses.tribalCouncilSafe],
      description: 'Revoke PROPOSER_ROLE from TC safe'
    },
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [TC_EXECUTOR_ROLE, addresses.tribalCouncilSafe],
      description: 'Revoke EXECUTOR_ROLE from TC safe from TC safe'
    },
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [TC_EXECUTOR_ROLE, addresses.podExecutorV2],
      description: 'Revoke EXECUTOR_ROLE from Pod Executor V2'
    },
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [TC_CANCELLER_ROLE, addresses.tribalCouncilSafe],
      description: 'Revoke CANCELLER_ROLE from TC safe'
    },
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [TC_TIMELOCK_ADMIN_ROLE, addresses.tribalCouncilTimelock],
      description: 'Revoke TIMELOCK_ADMIN_ROLE from the TC timelock'
    },
    // 4. Change beneficiary of deprecated Rari timelocks to DAO timelock
    // Claim vested funds
    {
      target: 'rariInfraFeiTimelock',
      values: '0',
      method: 'releaseMax(address)',
      arguments: (addresses) => [addresses.feiDAOTimelock],
      description: 'Release all currently vested FEI to the DAO timelock'
    },
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'releaseMax(address)',
      arguments: (addresses) => [addresses.core],
      description: 'Release all currently vested TRIBE back to the DAO treasury'
    },

    // Set pendingAdmins to DAO timelock
    {
      target: 'rariInfraFeiTimelock',
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: (addresses) => [addresses.feiDAOTimelock],
      description: 'Set pending admin of deprecated Rari FEI timelock to the DAO timelock'
    },
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: (addresses) => [addresses.feiDAOTimelock],
      description: 'Set pending admin of deprecated Rari TRIBE timelock to the DAO timelock'
    }
  ],
  description: `
  TIP_123: Deprecate Optimistic Governance and the Tribal Council

  This is a Tribal Council proposal that deprecates the Optimistic Governance and Tribal Council governance smart contracts. 

  The optimistic governance upgrade was introduced in FIP-82 (https://tribe.fei.money/t/fip-82-governance-enhancements/3945) 
  and in line with TIP-121 (https://tribe.fei.money/t/tip-121-proposal-for-the-future-of-the-tribe-dao/4475) 
  the tribal council would likely not be needed. Future governance proposals can be proposed and executed by the DAO.

  To deprecate, this proposal performs the following:
  1. Revoke Tribe roles from the optimistic governance smart contracts. This prevents the optimistic governance
     and Tribal Council contracts from interacting with the Fei system. A small number of high level access
     roles can later be removed by the DAO.
  2. Revoke all internal Tribal Council timelock EXECUTOR, PROPOSER, CANCELLER and TIMELOCK_ADMIN roles.
     This will render the Tribal Council timelock unusable by the Tribal Council Multisig.
  3. Change the admin of deprecated timelocks from the TC timelock to the DAO timelock

  Critically, this proposal if passed can be undone at any time by the DAO to reintroduce the Tribal Council while the DAO retains any governance power.

  The Tribe DAO optimistic governance process is outlined here: https://docs.tribedao.xyz/docs/Governance/Overview 
  `
};

export default tip_121a_pt2;
