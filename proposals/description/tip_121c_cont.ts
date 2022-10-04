import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Amount of Fei minted to redeem equivalent amount from feiPSM, for Aave escrow
const AMOUNT_FEI_MINTED_FOR_DAI_REDEEM = ethers.constants.WeiPerEther.mul(1_000_000);

// Amount of DAI available for withdrawal from Rari Pool 8
const AMOUNT_DAI_POOL_8_WITHDRAWAL = '24827902366047784229817';

const tip_121c_cont: TemplatedProposalDescription = {
  title: 'TIP-121c: veBAL OTC with Aave Companies',
  commands: [
    // 1. Grant Tribe Roles to the veBalOTCHelper, necessary to allow Aave to manage veBAL
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.vebalOtcHelper],
      description: 'Grant role PCV_CONTROLLER_ROLE to vebalOtcHelper'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), addresses.vebalOtcHelper],
      description: 'Grant role METAGOVERNANCE_TOKEN_STAKING to vebalOtcHelper'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'), addresses.vebalOtcHelper],
      description: 'Grant role METAGOVERNANCE_GAUGE_ADMIN to vebalOtcHelper'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), addresses.vebalOtcHelper],
      description: 'Grant role METAGOVERNANCE_VOTE_ADMIN to vebalOtcHelper'
    },

    // 2. Transfer balancerGaugeStakerProxy transfer to Aave Companies multisig
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'upgrade(address,address)', // proxy, impl
      arguments: (addresses) => [addresses.balancerGaugeStakerProxy, addresses.balancerGaugeStakerV2Impl],
      description: `Upgrade implementation of the balancerGaugeStakerProxy to balancerGaugeStakerV2Impl`
    },

    // Call initialise() method of new implementation contract via proxy, in context of proxy storage
    {
      target: 'balancerGaugeStaker',
      values: '0',
      method: '_initialize(address,address)',
      arguments: (addresses) => [addresses.vebalOtcHelper, addresses.balancerVotingEscrowDelegation],
      description:
        'Initialize the new state variables defined by the balancerGaugeStakerV2Impl, forward call from Proxy'
    },
    // Transfer proxyAdmin to Aave companies multisig
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'changeProxyAdmin(address,address)',
      arguments: (addresses) => [addresses.balancerGaugeStakerProxy, addresses.aaveCompaniesMultisig],
      description: 'Transfer proxy ownership of balancerGaugeStakerProxy to aaveCompaniesMultisig'
    },

    // 3. Update collateralization oracle
    // Track Aave escrowed DAI PCV deposit
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: (addresses) => [addresses.escrowedAaveDaiPCVDeposit],
      description: 'Track AAVE Companies escrowed 1M DAI in the CR'
    },

    // Remove empty PCV deposits
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: (addresses) => [
        [
          addresses.balancerLensVeBalBal,
          addresses.balancerLensVeBalWeth,
          addresses.balancerGaugeStakerProxy,
          addresses.balancerDepositBalWeth,
          addresses.ethToDaiLensDai,
          addresses.ethToDaiLensEth,
          addresses.lusdHoldingPCVDeposit,
          addresses.wethHoldingPCVDeposit,
          addresses.ethLidoPCVDeposit,
          addresses.daiHoldingPCVDeposit
        ]
      ],
      description: 'Remove deprecated/empty smart contracts from CR Oracle'
    },

    // 4. Transfer 1M DAI from PSM to Aave Escrow multisig
    // Grant self MINTER_ROLE
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: (addresses) => [addresses.feiDAOTimelock],
      description: 'Grant MINTER_ROLE to DAO timelock'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, AMOUNT_FEI_MINTED_FOR_DAI_REDEEM],
      description: 'Mint 1M FEI to the DAO timelock, later used to redeem 1M DAI from PSM'
    },
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.simpleFeiDaiPSM, AMOUNT_FEI_MINTED_FOR_DAI_REDEEM],
      description: 'Approve feiPSM to transfer 1M FEI'
    },
    {
      target: 'simpleFeiDaiPSM',
      values: '0',
      method: 'redeem(address,uint256,uint256)',
      arguments: (addresses) => [addresses.aaveCompaniesDaiEscrowMultisig, AMOUNT_FEI_MINTED_FOR_DAI_REDEEM, '0'],
      description: 'Redeem 1M DAI from simpleFeiDaiPSM and send to Aave Companies Escrow multisig'
    },
    // Cleanup, revoke MINTER_ROLE
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: (addresses) => [addresses.feiDAOTimelock],
      description: 'Revoke MINTER_ROLE from DAO timelock'
    },
    // 6. Deprecate various contracts, swap out DAI oracle in CR
    {
      target: 'ethToDaiLBPSwapper',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause ethToDaiLBPSwapper'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: (addresses) => [addresses.dai, addresses.oneConstantOracle],
      description: 'Swap DAI oracle for the OneConstantOracle'
    },
    // 7. Revoke all non-final Tribe roles
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

    // 8. Deprecate PCV Sentinel
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.pcvSentinel],
      description: 'Revoke GUARDIAN_ROLE from PCV Sentinel'
    },

    // 9. Deprecate PCV Guardian
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('GUARDIAN_ROLE'), addresses.pcvGuardian],
      description: 'Revoke GUARDIAN_ROLE from PCV Guardian'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.pcvGuardian],
      description: 'Revoke PCV_CONTROLLER_ROLE from PCV Guardian'
    },

    // 10. Revoke veto role from NopeDAO and cancel role from podAdminGateway
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('POD_VETO_ADMIN'), addresses.nopeDAO],
      description: 'Revoke POD_VETO_ADMIN from NopeDAO'
    },
    // Revoke ROLE_ADMIN from DAO timelock now that POD_VETO_ADMIN has been revoked
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('ROLE_ADMIN'), addresses.feiDAOTimelock],
      description: 'Revoke ROLE_ADMIN from feiDAOTimelock'
    },
    {
      target: 'tribalCouncilTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('CANCELLER_ROLE'), addresses.podAdminGateway],
      description: 'Revoke CANCELLER_ROLE from PodAdminGateway'
    },

    // 11. Deprecate ratioPCVControllerV2
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.ratioPCVControllerV2],
      description: 'Revoke PCV_CONTROLLER_ROLE from RatioPCVControllerV2'
    },
    // 12. Withdraw 25k DAI from Rari Pool 8
    {
      target: 'rariPool8DaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [addresses.tribeRedeemer, AMOUNT_DAI_POOL_8_WITHDRAWAL],
      description: 'Withdraw 25K DAI from Rari Pool 8 and send to Tribe Redeemer'
    }
  ],
  description: `
  TIP-121c: veBAL OTC with Aave Companies

  This proposal sets up the protocol to transfer 112k veBAL to Aave Companies for OTC trade.

Aave Companies will send 1,000,000 DAI to be escrowed on a 2/3 multisig with Aave Companies, Balancer DAO, and Tribe DAO (with eswak.eth as the designated representative).

In addition, the proposal moves 1M DAI from the FEI PSM to the escrow multisig to be sent to the TRIBE Redeemer.

After the Aave Companies team confirms they can properly use the veBAL-holding smart contracts, the 2/3 multisig will transfer 1M DAI to the TRIBE Redeemer, giving TRIBE holders access to the optimal amount of excess PCV for redemptions.

After the DAO Vote to disable governance, the final 1M DAI from Aave Companies would be sent back to the FEI PSM from the ⅔ Multisig.

Lastly, the proposal further cleans up unused roles in the system and performs maintenance on the collateralization oracle so that it is in the most up to date state.

  `
};

export default tip_121c_cont;
