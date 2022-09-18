import { TemplatedProposalDescription } from '@custom-types/types';
import { ethers } from 'ethers';

// Total amount of Fei on La Tribu timelock
// ~900k from the La Tribu clawback, ~500k from the previous TC action
// that calls releaseMax() on the deprecated Rari infra FEI timelock
// Approval set to a high of 5M, to prevent DAO vote from bricking if additional
// FEI is transferred to DAO during vote. Approval revoked at end of vote
const LA_TRIBU_FEI_UPPER_BOUND = ethers.constants.WeiPerEther.mul(5_000_000);

// Remaining LUSD balance
const LUSD_BALANCE = '102813103625677039438144';

// Expected amount of Curve swap DAI out, minus a 2% slippage
const MIN_EXPECTED_DAI_OUT = ethers.constants.WeiPerEther.mul(103_000);

const tip_121a_pt3: TemplatedProposalDescription = {
  title: 'TIP-121a (cont.): Sell last LUSD, Timelock and Role Cleanup + La Tribu Clawback',
  commands: [
    // 1. Revoke non-major Tribe roles
    // GOVERN_ROLE on optimistic governance
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GOVERN_ROLE'), addresses.roleBastion],
      description: 'Revoke GOVERN_ROLE from roleBastion'
    },
    // TOKEMAK_DEPOSIT_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE'), addresses.feiDAOTimelock],
      description: 'Revoke TOKEMAK_DEPOSIT_ADMIN_ROLE from feiDAOTimelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TOKEMAK_DEPOSIT_ADMIN_ROLE'), addresses.tribalCouncilTimelock],
      description: 'Revoke TOKEMAK_DEPOSIT_ADMIN_ROLE from Tribal Council Timelock'
    },
    // FEI_MINT_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('FEI_MINT_ADMIN'), addresses.feiDAOTimelock],
      description: 'Revoke FEI_MINT_ADMIN from DAO timelock'
    },
    // ROLE_ADMIN
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('ROLE_ADMIN'), addresses.tribalCouncilTimelock],
      description: 'Revoke ROLE_ADMIN from Tribal Council Timelock'
    },
    // MINTER_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.pcvEquityMinter],
      description: 'Revoke MINTER_ROLE from PCV Equity Minter'
    },
    // SWAP_ADMIN_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('SWAP_ADMIN_ROLE'), addresses.pcvEquityMinter],
      description: 'Revoke SWAP_ADMIN_ROLE from PCV Equity Minter'
    },
    // 2. Clawback La Tribu FEI and TRIBE timelocks
    // Burn FEI
    {
      target: 'laTribuFeiTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback La Tribu FEI timelock'
    },
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.ratioPCVControllerV2, LA_TRIBU_FEI_UPPER_BOUND],
      description: 'Approve the ratioPCVController to move the FEI on the La Tribu FEI timelock'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'transferFromRatio(address,address,address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, addresses.fei, addresses.daiFixedPricePSM, '10000'],
      description: `
      Transfer all FEI from the DAO timelock to the DAI PSM. It will later be 
      burned.
      `
    },

    // Send TRIBE to Core
    {
      target: 'laTribuTribeTimelock',
      values: '0',
      method: 'clawback()',
      arguments: (addresses) => [],
      description: 'Clawback La Tribu TRIBE timelock'
    },
    {
      target: 'tribe',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [
        addresses.core,
        ethers.constants.WeiPerEther.mul(1_000_000) // 1M TRIBE, as cliff not reached
      ],
      description: 'Send all 1M TRIBE clawed back to the Core Treasury'
    },
    // 3. Accept admin of Rari deprecated timelocks
    {
      target: 'rariInfraFeiTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary of the deprecated Rari Infra FEI timelock'
    },
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary of the deprecated Rari Infra TRIBE timelock'
    },
    // 4. Remove Aave PCV Sentinel guard, as now fully withdrawn
    {
      target: 'pcvSentinel',
      values: '0',
      method: 'slay(address)',
      arguments: (addresses) => [addresses.maxFeiWithdrawalGuard],
      description: 'Remove Aave/Compound max Fei withdrawl guard from PCV sentinel'
    },
    // 5. Sell last LUSD
    {
      target: 'lusdHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, LUSD_BALANCE],
      description: 'Withdraw all 100k LUSD from the LUSD holding deposit to the DAO timelock'
    },
    {
      target: 'lusd',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.lusdCurveMetapool, LUSD_BALANCE],
      description: 'Approve Curve Metapool to make LUSD swap'
    },
    {
      target: 'lusdCurveMetapool',
      values: '0',
      method: 'exchange_underlying(int128,int128,uint256,uint256,address)',
      arguments: (addresses) => [
        '0', // LUSD
        '1', // DAI
        LUSD_BALANCE, // dx - amount of LUSD being swapped
        MIN_EXPECTED_DAI_OUT, // dy  - minimum amount of DAI to receive
        addresses.daiHoldingPCVDeposit // receiving address
      ],
      description: 'Sell last 100k of LUSD on Curve. Accept up to 2% slippage'
    },
    // 6. Zero out FEI approval given to ratioPCVController
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.ratioPCVControllerV2, '0'],
      description: 'Remove remaining FEI approval on ratioPCVControllerV2'
    }
  ],
  description: `
  TIP-121a (cont.): Sell last LUSD, Timelock and Role Cleanup + La Tribu Clawback
  
  This proposal is a continuation of the first stage of TIP-121
  (https://tribe.fei.money/t/tip-121-proposal-for-the-future-of-the-tribe-dao/4475). 
  
  This proposal sells the last ~100k LUSD for DAI using a curve swap. 
  
  It also claws back ~1M FEI and TRIBE from La Tribu, closing out the last DAO funded initiative.

  It disables the PCV Sentinel Aave/Compound Fei withdrawal guard as the Fei has been withdrawn.
  
  It cleans up the timelocks and deprecated roles in the system, where any of these changes can be reversed in a further DAO vote if needed.
  `
};

export default tip_121a_pt3;
