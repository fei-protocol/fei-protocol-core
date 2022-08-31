import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Amount of FEI held on the TC
const TC_FEI_BALANCE = '2733169815107120096987175';

// Amount of TRIBE held on the TC
const TC_TRIBE_BALANCE = '2733170474316903966022879';

// Tribal Council related Tribe roles
const POD_ADMIN_ROLE = ethers.utils.id('POD_ADMIN');
const POD_METADATA_REGISTER_ROLE = ethers.utils.id('POD_METADATA_REGISTER_ROLE');
const PCV_MINOR_PARAM_ROLE = ethers.utils.id('PCV_MINOR_PARAM_ROLE');
const POD_VETO_ADMIN = ethers.utils.id('POD_VETO_ADMIN');
const METAGOVERNANCE_GAUGE_ADMIN = ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN');
const METAGOVERNANCE_VOTE_ADMIN = ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN');
const PCV_SAFE_MOVER_ROLE = ethers.utils.id('PCV_SAFE_MOVER_ROLE');
const PCV_GUARDIAN_ADMIN_ROLE = ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE');
const FUSE_ADMIN = ethers.utils.id('FUSE_ADMIN');
const PSM_ADMIN_ROLE = ethers.utils.id('PSM_ADMIN_ROLE');
const SWAP_ADMIN_ROLE = ethers.utils.id('SWAP_ADMIN_ROLE');
const ORACLE_ADMIN_ROLE = ethers.utils.id('ORACLE_ADMIN_ROLE');
const FEI_MINT_ADMIN = ethers.utils.id('FEI_MINT_ADMIN');

// TODO: Roles that need revoking in a DAO vote (Governor is admin)
const GOVERN_ROLE = ethers.utils.id('GOVERN_ROLE');
const TOKEMAK_DEPOSIT_ADMIN_ROLE = ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE');
const ROLE_ADMIN = ethers.utils.id('ROLE_ADMIN');

// Timelock roles
const TC_PROPOSER_ROLE = ethers.utils.id('PROPOSER_ROLE');
const TC_CANCELLER_ROLE = ethers.utils.id('CANCELLER_ROLE');
const TC_EXECUTOR_ROLE = ethers.utils.id('EXECUTOR_ROLE');
const TC_TIMELOCK_ADMIN_ROLE = ethers.utils.id('TIMELOCK_ADMIN_ROLE');

const deprecate_tc: TemplatedProposalDescription = {
  title: 'Deprecate Optimistic Governance and Tribal Council',
  commands: [
    // 1. Burn all FEI held on the timelock
    {
      target: 'fei',
      values: '0',
      method: 'burn(uint256)',
      arguments: (addresses) => [TC_FEI_BALANCE],
      description: 'Burn all 2.7M FEI on the Tribal Council timelock'
    },

    // 2. Send all TRIBE held to the Core Treasury
    {
      target: 'tribe',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.core, TC_TRIBE_BALANCE],
      description: 'Send all 2.7M TRIBE on the Tribal Council timelock to the Core Treasury'
    },

    // 3. Revoke all Tribe governance roles from the optimistic governance system
    // POD_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [POD_ADMIN_ROLE, addresses.tribalCouncilTimelock],
      description: 'Revoke POD_ADMIN_ROLE from the TC timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [POD_ADMIN_ROLE, addresses.podFactory],
      description: 'Revoke POD_ADMIN_ROLE from the Pod Factory'
    },
    // TODO: TOKEMAK_DEPOST_ADMIN_ROLE has GOVERN_ROLE as admin
    // {
    //   target: 'core',
    //   values: '0',
    //   method: 'revokeRole(bytes32,address)',
    //   arguments: (addresses) => [TOKEMAK_DEPOSIT_ADMIN_ROLE, addresses.tribalCouncilTimelock],
    //   description: 'Revoke TOKEMAK_DEPOSIT_ADMIN_ROLE from the TC timelock'
    // },
    // PCV_MINOR_PARAM_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [PCV_MINOR_PARAM_ROLE, addresses.tribalCouncilTimelock],
      description: 'Revoke PCV_MINOR_PARAM_ROLE from the TC timelock'
    },
    // FEI_MINT_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [FEI_MINT_ADMIN, addresses.tribalCouncilTimelock],
      description: 'Revoke FEI_MINT_ADMIN from the TC timelock'
    },
    // POD_METADATA_REGISTER_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [POD_METADATA_REGISTER_ROLE, addresses.tribeDev2Deployer],
      description: 'Revoke POD_METADATA_REGISTER_ROLE from the Tribe Dev 2'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [POD_METADATA_REGISTER_ROLE, addresses.tribeDev3Deployer],
      description: 'Revoke POD_METADATA_REGISTER_ROLE from the Tribe Dev 3'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [POD_METADATA_REGISTER_ROLE, addresses.tribeDev4Deployer],
      description: 'Revoke POD_METADATA_REGISTER_ROLE from the Tribe Dev 4'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [POD_METADATA_REGISTER_ROLE, addresses.tribalCouncilSafe],
      description: 'Revoke POD_METADATA_REGISTER_ROLE from the Tribal Council Safe'
    },
    // TODO: Revoke in DAO vote, ROLE_ADMIN
    // {
    //   target: 'core',
    //   values: '0',
    //   method: 'revokeRole(bytes32,address)',
    //   arguments: (addresses) => [ROLE_ADMIN, addresses.tribalCouncilTimelock],
    //   description: 'Revoke ROLE_ADMIN from the Tribal Council timelock'
    // },
    // METAGOVERNANCE_GAUGE_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [METAGOVERNANCE_GAUGE_ADMIN, addresses.tribalCouncilTimelock],
      description: 'Revoke METAGOVERNANCE_GAUGE_ADMIN from the Tribal Council timelock'
    },
    // METAGOVERNANCE_VOTE_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [METAGOVERNANCE_VOTE_ADMIN, addresses.tribalCouncilTimelock],
      description: 'Revoke METAGOVERNANCE_VOTE_ADMIN from the Tribal Council timelock'
    },
    // PCV_SAFE_MOVER_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [PCV_SAFE_MOVER_ROLE, addresses.tribalCouncilTimelock],
      description: 'Revoke PCV_SAFE_MOVER_ROLE from the Tribal Council timelock'
    },
    // PCV_GUARDIAN_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [PCV_GUARDIAN_ADMIN_ROLE, addresses.tribalCouncilTimelock],
      description: 'Revoke PCV_GUARDIAN_ADMIN_ROLE from the Tribal Council timelock'
    },
    // FUSE_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [FUSE_ADMIN, addresses.tribalCouncilTimelock],
      description: 'Revoke FUSE_ADMIN from the Tribal Council timelock'
    },
    // PSM_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [PSM_ADMIN_ROLE, addresses.tribalCouncilTimelock],
      description: 'Revoke PSM_ADMIN_ROLE from the Tribal Council timelock'
    },
    // SWAP_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [SWAP_ADMIN_ROLE, addresses.tribalCouncilTimelock],
      description: 'Revoke SWAP_ADMIN_ROLE from the Tribal Council timelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [SWAP_ADMIN_ROLE, addresses.tribalCouncilSafe],
      description: 'Revoke SWAP_ADMIN_ROLE from the Tribal Council Safe'
    },
    // ORACLE_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ORACLE_ADMIN_ROLE, addresses.tribalCouncilTimelock],
      description: 'Revoke ORACLE_ADMIN_ROLE from the Tribal Council timelock'
    },
    // POD_VETO_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [POD_VETO_ADMIN, addresses.nopeDAO],
      description: 'Revoke POD_VETO_ADMIN from the NopeDAO'
    },

    // 4. Revoke all CANCELLERS, PROPOSERS and EXECUTORS
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
    }
  ],
  description: `
  Deprecate Optimistic Governance and Tribal Council
  1. Burn all FEI on the TC timelock
  2. Send all TRIBE on the TC timelock to Core Treasury
  3. Revoke all Tribe roles from the optimistic governance smart contracts
  4. Revoke all Tribal Council timelock internal EXECUTOR, PROPOSER, CANCELLER, ADMIN roles
  `
};

export default deprecate_tc;
