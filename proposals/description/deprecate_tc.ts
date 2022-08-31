import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Amount of FEI held on the TC
const TC_FEI_BALANCE = ethers.constants.WeiPerEther.mul(1);

// Amount of TRIBE held on the TC
const TC_TRIBE_BALANCE = ethers.constants.WeiPerEther.mul(1);

// Tribal Council related Tribe roles
const POD_ADMIN_ROLE = ethers.utils.id('POD_ADMIN');
const POD_METADATA_REGISTER_ROLE = ethers.utils.id('POD_METADATA_ROLE');
const PCV_MINOR_PARAM_ROLE = ethers.utils.id('PCV_MINOR_PARAM_ROLE');
const TOKEMAK_DEPOSIT_ADMIN_ROLE = ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE');
const POD_VETO_ADMIN = ethers.utils.id('POD_VETO_ADMIN');
const ROLE_ADMIN = ethers.utils.id('ROLE_ADMIN');
const METAGOVERNANCE_GAUGE_ADMIN = ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN');
const METAGOVERNANCE_VOTE_ADMIN = ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN');
const PCV_SAFE_MOVER_ROLE = ethers.utils.id('PCV_SAFE_MOVER_ROLE');
const PCV_GUARDIAN_ADMIN_ROLE = ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE');
const FUSE_ADMIN = ethers.utils.id('FUSE_ADMIN');
const PSM_ADMIN_ROLE = ethers.utils.id('PSM_ADMIN_ROLE');
const SWAP_ADMIN_ROLE = ethers.utils.id('SWAP_ADMIN_ROLE');
const ORACLE_ADMIN_ROLE = ethers.utils.id('ORACLE_ADMIN_ROLE');
const FEI_MINT_ADMIN = ethers.utils.id('FEI_MINT_ADMIN');

// TODO: May need revoking in a DAO vote
const GOVERN_ROLE = ethers.utils.id('GOVERN_ROLE');

const deprecate_tc: TemplatedProposalDescription = {
  title: 'Deprecate Optimistic Governance and Tribal Council',
  commands: [
    // 1. Move all funds off the TC timelock
    {
      target: 'fei',
      values: '0',
      method: 'burn(uint256)',
      arguments: (addresses) => [TC_FEI_BALANCE],
      description: 'Burn all XM FEI on the Tribal Council timelock'
    },
    {
      target: 'tribe',
      values: '0',
      method: 'burn(uint256)',
      arguments: (addresses) => [TC_TRIBE_BALANCE],
      description: 'Send all XM TRIBE on the Tribal Council timelock to the Core Treasury'
    },
    // 2. Revoke all Tribe governance roles from the optimistic governance system
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
    // TOKEMAK_DEPOST_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [TOKEMAK_DEPOSIT_ADMIN_ROLE, addresses.tribalCouncilTimelock],
      description: 'Revoke TOKEMAK_DEPOSIT_ADMIN_ROLE from the TC timelock'
    },
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
    }
  ],
  description: `
  Deprecate Optimistic Governance and Tribal Council
  

  `
};

export default deprecate_tc;
