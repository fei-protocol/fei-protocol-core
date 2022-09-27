import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_vebalotc: TemplatedProposalDescription = {
  title: 'TIP-121c: veBAL OTC',
  commands: [
    // 1. Handle veBAL OTC
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

    // 2. Move dust Balancer-related funds to TC Multisig for selling
    {
      target: 'veBalDelegatorPCVDeposit',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.bal, addresses.tribalCouncilSafe, '2032918269598796318544'],
      description: 'Send 2,032.91 BAL to TC Multisig'
    },
    {
      target: 'veBalDelegatorPCVDeposit',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.bbausd, addresses.tribalCouncilSafe, '35748982138950025950604'],
      description: 'Send 35,748.98 bb-a-USD to TC Multisig'
    },
    {
      target: 'balancerGaugeStaker',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.bal, addresses.tribalCouncilSafe, '13381940574938719587015'],
      description: 'Send 13,381.94 BAL to TC Multisig'
    },

    // 3. Handle balancerGaugeStaker proxy transfer
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'upgrade(address,address)',
      arguments: (addresses) => [addresses.balancerGaugeStakerProxy, addresses.balancerGaugeStakerV2Impl],
      description: `Upgrade implementation of the balancerGaugeStaker`
    },
    {
      target: 'balancerGaugeStaker',
      values: '0',
      method: '_initialize(address,address)',
      arguments: (addresses) => [addresses.vebalOtcHelper, addresses.balancerVotingEscrowDelegation],
      description: 'Initialize BalancerGaugeStakerProxy state variables'
    },
    // {
    //   target: 'balancerGaugeStakerV2Impl',
    //   values: '0',
    //   method: '_initialize(address,address)',
    //   arguments: (addresses) => [addresses.vebalOtcHelper, addresses.balancerVotingEscrowDelegation],
    //   description: 'Initialize BalancerGaugeStakerV2 implementation state variables'
    // },
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'changeProxyAdmin(address,address)',
      arguments: (addresses) => [addresses.balancerGaugeStakerProxy, addresses.aaveCompaniesMultisig],
      description:
        'Transfer proxy ownership of BalancerGaugeStakerProxy to aaveCompaniesMultisig'
    },

    // Finally, CR Oracle updates
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: (addresses) => [
        [
          addresses.balancerLensVeBalBal,
          addresses.balancerLensVeBalWeth,
          addresses.balancerGaugeStakerProxy,
          addresses.balancerDepositBalWeth
        ]
      ],
      description: 'Remove deprecated/empty smart contracts from CR Oracle'
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
  - 2. Move dust Balancer-related funds to TC Multisig for selling
  `
};

export default tip_vebalotc;
