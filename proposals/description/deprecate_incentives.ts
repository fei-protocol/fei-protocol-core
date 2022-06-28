import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const deprecate_incentives: TemplatedProposalDescription = {
  title: 'TIP-118: Cleanup part 2',
  commands: [
    // Withdraw excess TRIBE from reward system
    {
      target: 'erc20Dripper',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.tribe, addresses.core, '2508838570600494412126519'],
      description: 'Withdraw 2.5M TRIBE from the ERC20 Dripper to the Core Treasury'
    },
    {
      target: 'votiumBriber3Crvpool',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.tribe, addresses.core, '1725076846586787179639648'],
      description: `
      Withdraw all TRIBE from 3CRV Votium briber contract to the Core Treasury. 
      
      Withdraw is made up of 200k TRIBE pre-existing on this contract and then an additional 1.5M TRIBE 
      that was harvested from the stakingTokenWrapperBribe3Crvpool.
      `
    },
    {
      target: 'votiumBriberD3pool',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.tribe, addresses.core, '232096077769383622085234'],
      description: `
      Withdraw all TRIBE from D3 Votium briber contract to the Core Treasury. 
      
      Withdraw is made up of 230k TRIBE that was harvested from the stakingTokenWrapperBribeD3pool.
      `
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: '_grantComp(address,uint256)',
      arguments: (addresses) => [addresses.core, '150000000000000000000000'],
      description: `Withdraw excess 164k TRIBE from Rari delegator contract`
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'governorWithdrawTribe(uint256)',
      arguments: (addresses) => ['26833947775112516867325654'],
      description: `
      Withdraw remaining TRIBE from the Tribal Chief to the Core Treasury. 
      
      Withdrawal amount = 
      (Tribal Chief balance before harvest 
            - (pending rewards, Uniswap-v2 FEI/TRIBE LP + Curve 3crv-FEI metapool LP + G-UNI DAI/FEI 0.05% fee tier)
      
      Withdrawal amount = 27.4M - 0.565M = 26.8M
      `
    },

    ////  Revoke roles from contracts that interacted with Tribal Chief and rewards system
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.optimisticTimelock],
      description: ' Revoke TRIBAL_CHIEF_ADMIN_ROLE from OptimisticTimelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.tribalCouncilTimelock],
      description: ' Revoke TRIBAL_CHIEF_ADMIN_ROLE from Tribal Council timelock'
    },

    //// Transfer the admin of the Aave Tribe Incentives Controller Proxy to Aave governance
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'changeProxyAdmin(address,address)',
      arguments: (addresses) => [addresses.aaveTribeIncentivesController, addresses.aaveLendingPoolAddressesProvider],
      description: `
      Transfer the admin of the Aave Tribe Incentives Controller Proxy to Aave governance, specifically 
      the LendingPoolAddressesProvider.
      `
    },

    //// agEUR Redemption
    {
      target: 'angleDelegatorPCVDeposit',
      values: '0',
      method: 'claimGaugeRewards(address)',
      arguments: (addresses) => [
        addresses.angleGaugeUniswapV2FeiAgEur // gauge
      ],
      description: 'Claim all unclaimed ANGLE rewards'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.angleDelegatorPCVDeposit, // pcvDeposit
        addresses.angle, // token
        addresses.tribalCouncilSafe, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate all ANGLE to TC Multisig where it can be sold'
    },
    {
      target: 'angleDelegatorPCVDeposit',
      values: '0',
      method: 'unstakeFromGauge(address,uint256)',
      arguments: (addresses) => [
        addresses.angleAgEurFeiPool, // token
        '9295203165522303785936702' // all LP tokens
      ],
      description: 'Unstake all agEUR/FEI Uniswap tokens from gauge'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.angleDelegatorPCVDeposit, // pcvDeposit
        addresses.angleAgEurFeiPool, // token
        addresses.agEurUniswapPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all agEUR/FEI Uniswap tokens to PCV deposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [
        addresses.agEurUniswapPCVDeposit, // pcvDeposit
        addresses.agEurUniswapPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Remove all agEUR/FEI Uniswap liquidity & burn FEI'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.agEurUniswapPCVDeposit, // pcvDeposit
        addresses.agEUR, // token
        addresses.angleEuroRedeemer, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Move all agEUR to redeemer'
    },
    {
      target: 'angleEuroRedeemer',
      values: '0',
      method: 'redeem()',
      arguments: (addresses) => [],
      description: 'Redeem all agEUR for FEI and DAI and send to DAI PSM'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: (addresses) => [[addresses.agEurUniswapPCVDeposit, addresses.uniswapLensAgEurUniswapGauge]],
      description: 'Remove agEUR addresses from CR oracle'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'unsetSafeAddress(address)',
      arguments: (addresses) => [addresses.agEurUniswapPCVDeposit],
      description: 'Remove agEurUniswapPCVDeposit from safe addresses'
    }
  ],
  description: `
  TIP-118: Cleanup part 2
  
  This vote contains multiple cleanup actions bundled in one DAO vote :
  - Incentives cleanup (reclaim TRIBE tokens that are not owed to any users)
  - agEUR redeem (redeem agEUR for USDC and convert to DAI using Maker PSM)

  The details are provided below.

  ----------------------------------------------------------

  TIP-114: Deprecate TRIBE Incentives system

  Deprecates the TRIBE incentives system according to proposal: 

  Specifically it:
  - Withdraws remaining TRIBE from the TribalChief, leaving enough behind to fully fund existing commitments
  - Withdraws all TRIBE from 3Crv and D3 Votium briber contracts
  - Withdraws remaining TRIBE from ERC20 Dripper
  - Revokes no longer needed TRIBAL_CHIEF_ADMIN_ROLE roles
  - Transfers the admin of the Aave Fei Incentives Controller Proxy to Aave Governance

  ----------------------------------------------------------

  TIP-110: agEUR & Angle redeem

  Convert all agEUR in the PCV to DAI, and deprecate all Angle Protocol-related contracts, except the contract that is holding vote-escrowed ANGLE.

  This proposal will perform the following actions :
  - Move all ANGLE rewards to TC Multisig where they can be sold
  - Unstake from Angle Protocol's Gauge all agEUR/FEI Uniswap tokens
  - Move all agEUR/FEI Uniswap tokens to PCV deposit
  - Remove all agEUR/FEI Uniswap liquidity & burn FEI
  - Redeem agEUR for DAI, and send proceeds to DAI PSM
  - Unset agEUR safe addresses & CR oracle entries
  `
};

export default deprecate_incentives;
