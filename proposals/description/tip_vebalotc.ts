import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_vebalotc: TemplatedProposalDescription = {
  title: 'TIP-121b: veBAL OTC',
  commands: [
    // 1. Handle veBAL OTC
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'changeProxyAdmin(address,address)',
      arguments: (addresses) => [addresses.balancerGaugeStaker, addresses.vebalOtcHelper],
      description: 'Transfer proxy ownership of balancerGaugeStaker to vebalOtcHelper'
    },
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

    // 3. Cleanup LUSD->DAI Auction contracts (send dust to TC multisig for selling)
    {
      target: 'lusdToDaiSwapper',
      values: '0',
      method: 'exitPool(address)',
      arguments: (addresses) => [addresses.daiHoldingPCVDeposit],
      description: 'Move all DAI and LUSD to daiHoldingPCVDeposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.daiHoldingPCVDeposit, // pcvDeposit
        addresses.lusd, // token
        addresses.tribalCouncilSafe, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all LUSD from daiHoldingPCVDeposit to the TC Multisig'
    },

    // 4. Cleanup WETH->DAI Auction contracts (send dust to TC multisig for selling)
    {
      target: 'ethToDaiLBPSwapper',
      values: '0',
      method: 'exitPool(address)',
      arguments: (addresses) => [addresses.daiHoldingPCVDeposit],
      description: 'Move all DAI and WETH to daiHoldingPCVDeposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.daiHoldingPCVDeposit, // pcvDeposit
        addresses.weth, // token
        addresses.tribalCouncilSafe, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all WETH from daiHoldingPCVDeposit to the TC Multisig'
    },

    // 5. Cleanup FEI/TRIBE on TC Timelock from the Rari Infra team clawback
    {
      target: 'tribe',
      values: '0',
      method: 'transferFrom(address,address,uint256)',
      arguments: (addresses) => [addresses.tribalCouncilTimelock, addresses.core, '2733170474316903966022879'],
      description: 'Move all TRIBE from TC Timelock to DAO Treasury'
    },
    {
      target: 'fei',
      values: '0',
      method: 'transferFrom(address,address,uint256)',
      arguments: (addresses) => [
        addresses.tribalCouncilTimelock,
        addresses.feiDAOTimelock,
        '2733169815107120096987175'
      ],
      description: 'Move all FEI from TC Timelock to DAO Timelock'
    },
    {
      target: 'fei',
      values: '0',
      method: 'burn(uint256)',
      arguments: (addresses) => ['2733169815107120096987175'],
      description: 'Burn FEI from the DAO Timelock'
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
          addresses.balancerGaugeStaker,
          addresses.balancerDepositBalWeth,
          addresses.aaveFeiPCVDepositWrapper,
          addresses.wethHoldingPCVDeposit,
          addresses.lusdToDaiLensLusd,
          addresses.lusdToDaiLensDai,
          addresses.ethToDaiLensDai,
          addresses.ethToDaiLensEth,
          addresses.tribalCouncilTimelockFeiLens
        ]
      ],
      description: 'Remove deprecated/empty smart contracts from CR Oracle'
    }
  ],
  description: `
  TIP-121b: veBAL OTC

  This proposal sets up the protocol to be able to transfer its 112k veBAL to Aave Companies for OTC trade.

  This proposal also includes several cleanup items to wrap up previous proposals.

  The full list of actions of this proposal is :
  - 1. Handle veBAL OTC
  - 2. Move dust Balancer-related funds to TC Multisig for selling
  - 3. Cleanup LUSD->DAI Auction contracts (send dust to TC multisig for selling)
  - 4. Cleanup WETH->DAI Auction contracts (send dust to TC multisig for selling)
  - 5. Cleanup FEI/TRIBE on TC Timelock from the Rari Infra team clawback (send TRIBE to DAO treasury, burn FEI)
  `
};

export default tip_vebalotc;
