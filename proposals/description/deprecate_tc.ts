import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Timelock roles
const TC_PROPOSER_ROLE = ethers.utils.id('PROPOSER_ROLE');
const TC_CANCELLER_ROLE = ethers.utils.id('CANCELLER_ROLE');
const TC_EXECUTOR_ROLE = ethers.utils.id('EXECUTOR_ROLE');
const TC_TIMELOCK_ADMIN_ROLE = ethers.utils.id('TIMELOCK_ADMIN_ROLE');

const deprecate_tc: TemplatedProposalDescription = {
  title: 'Deprecate Optimistic Governance and Tribal Council',
  commands: [
    // 1. Revoke all Tribe governance roles from the optimistic governance system
    // POD_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_ADMIN'), addresses.tribalCouncilTimelock],
      description: 'Revoke POD_ADMIN_ROLE from the TC timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_ADMIN'), addresses.podFactory],
      description: 'Revoke POD_ADMIN_ROLE from the Pod Factory'
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
    // POD_VETO_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_VETO_ADMIN'), addresses.nopeDAO],
      description: 'Revoke POD_VETO_ADMIN from the NopeDAO'
    },

    // 2. Revoke all CANCELLERS, PROPOSERS and EXECUTORS
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
      arguments: (addresses) => [TC_CANCELLER_ROLE, addresses.podAdminGateway],
      description: `
      Revoke CANCELLER_ROLE from Pod Admin Gateway, the contract through which the NopeDAO 
      vetoes.
      `
    },
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [TC_TIMELOCK_ADMIN_ROLE, addresses.tribalCouncilTimelock],
      description: 'Revoke TC_TIMELOCK_ADMIN_ROLE from the TC timelock'
    },
    // 3. Change beneficiary of old Rari Infra FEI and TRIBE vesting timelocks to DAO timelock
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
      description: 'Set pending beneficiary of the old Rari FEI timelock to the DAO timelock'
    },
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'setPendingBeneficiary(address)',
      arguments: (addresses) => [addresses.feiDAOTimelock],
      description: 'Set pending beneficiary of the old Rari TRIBE timelock to the DAO timelock'
    }
  ],
  description: `
  Deprecate Optimistic Governance and Tribal Council
  1. Revoke all Tribe roles from the optimistic governance smart contracts
  2. Revoke all Tribal Council timelock internal EXECUTOR, PROPOSER, CANCELLER, ADMIN roles
  3. Change beneficiary of the old Rari Infra vesting FEI and TRIBE timelocks from the TC timelock
     to the DAO timelock. A subsequent proposal will then change this beneficiary again 
     to burner addresses
  `
};

export default deprecate_tc;
