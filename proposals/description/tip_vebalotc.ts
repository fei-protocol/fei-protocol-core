import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Amount of Fei minted to redeem equivalent amount from feiPSM, for Aave escrow
const AMOUNT_FEI_MINTED_FOR_DAI_REDEEM = ethers.constants.WeiPerEther.mul(1_000_000);

const tip_vebalotc: TemplatedProposalDescription = {
  title: 'TIP-121c: veBAL OTC',
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
          addresses.ethLidoPCVDeposit
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
    // 6. Deprecate various contracts, cleanup
    {
      target: 'ethToDaiLBPSwapper',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause ethToDaiLBPSwapper'
    }
  ],
  description: `
  TIP-121c: veBAL OTC

  This proposal sets up the protocol to be able to transfer its 112k veBAL to Aave Companies for OTC trade.

  The 1,000,000 DAI will be escrowed on a 3/3 multisig with Aave Companies, Balancer DAO, and Tribe DAO.
  The Tribe DAO designates eswak.eth to be signer on this 3/3 multisig.

  After the Aave Companies team confirms they can properly use the veBAL-holding smart contracts, the 3/3 multisig will transfer the DAI to the Tribe DAO.

  The full list of actions of this proposal is :
  - 1. Handle veBAL OTC
  `
};

export default tip_vebalotc;
