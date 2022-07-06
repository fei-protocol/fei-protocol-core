import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_118: TemplatedProposalDescription = {
  title: 'TIP_118: PSM deprecation, Incentives withdrawal, agEUR redemption',
  commands: [
    //////////////      PSM DEPRECATION ////////////////
    // 1. Transfer all assets off the PSMs to the new empty PCV deposits
    // ETH PSM
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.ethPSM, // pcvDeposit
        addresses.weth, // token
        addresses.wethHoldingPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate WETH from the ETH PSM to the new WETH Holding PCV deposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.ethPSM, // pcvDeposit
        addresses.fei, // token
        addresses.daiFixedPricePSM, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate FEI from ETH PSM to the DAI PSM'
    },

    // LUSD_PSM
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.lusdPSM, // pcvDeposit
        addresses.lusd, // token
        addresses.lusdHoldingPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate LUSD from the LUSD PSM to the LUSD holding PCV deposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.lusdPSM, // pcvDeposit
        addresses.fei, // token
        addresses.daiFixedPricePSM, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate FEI from the LUSD PSM to the DAI PSM'
    },

    // 2. Revoke PSM permissions
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.ethPSM],
      description: 'Revoke MINTER_ROLE from ETH PSM'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('MINTER_ROLE'), addresses.lusdPSM],
      description: 'Revoke MINTER_ROLE from LUSD PSM'
    },

    // RAI PSM does not have MINTER_ROLE

    // 3. Pause all unpaused functionality on the PSMs
    {
      target: 'raiPriceBoundPSM',
      values: '0',
      method: 'pauseRedeem()',
      arguments: (addresses) => [],
      description: 'Pause redemptions on the Rai Price bound PSM'
    },

    ///  PCV DRIP CONTROLLERS
    {
      target: 'aaveEthPCVDripController',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause the ETH PCV drip controller'
    },
    {
      target: 'raiPCVDripController',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause the RAI PCV drip controller'
    },
    {
      target: 'lusdPCVDripController',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause the LUSD PCV drip controller'
    },

    ///// Deprecate PSM skimmers
    {
      target: 'lusdPSMFeiSkimmer',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause the LUSD PSM Fei skimmer'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.lusdPSMFeiSkimmer],
      description: 'Revoke PCV_CONTROLLER_ROLE from lusdPSMFeiSkimmer'
    },

    {
      target: 'ethPSMFeiSkimmer',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: 'Pause the ETH PSM Fei skimmer'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.ethPSMFeiSkimmer],
      description: 'Revoke PCV_CONTROLLER_ROLE from ethPSMFeiSkimmer'
    },

    //// Activate DAI PSM skimmer and burn Fei
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.daiFixedPricePSMFeiSkimmer],
      description: 'Grant PCV_CONTROLLER_ROLE to daiFixedPricePSMFeiSkimmer'
    },
    {
      target: 'daiFixedPricePSMFeiSkimmer',
      values: '0',
      method: 'skim()',
      arguments: (addresses) => [],
      description: 'Burn excess Fei on the DAI PSM. Will burn ~135M FEI'
    },

    //////////   CONFIGURE NEW ERC20 PCV HOLDING DEPOSITS /////////////
    // Add new ERC20 Holding deposits to the Collaterization Oracle
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: (addresses) => [
        [
          addresses.wethHoldingPCVDeposit,
          addresses.lusdHoldingPCVDeposit,
          addresses.daiHoldingPCVDeposit,
          addresses.voltHoldingPCVDeposit
        ]
      ],
      description: `
      Add the holding ERC20 deposits to the Collaterization Oracle.
      gOHM deposit not added as does not yet have an oracle.`
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddresses(address[])',
      arguments: (addresses) => [
        [
          addresses.wethHoldingPCVDeposit,
          addresses.lusdHoldingPCVDeposit,
          addresses.daiHoldingPCVDeposit,
          addresses.voltHoldingPCVDeposit,
          addresses.gOHMHoldingPCVDeposit
        ]
      ],
      description: 'Set all new ERC20 holding deposits as safe addresses on the PCV Guardian'
    },

    ///// Send VOLT to it's holding ERC20 deposit
    {
      target: 'volt',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.voltHoldingPCVDeposit, '10000000000000000000000000'],
      description: 'Move 10M VOLT from the DAO timelock to the VOLT holding PCV deposit'
    },

    ///// Send gOHM to it's holding ERC20 deposit
    {
      target: 'gOHM',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.gOHMHoldingPCVDeposit, '577180000000000000000'],
      description: 'Send 577 gOHM from the DAO timelock to the gOHM holding PCV deposit'
    },

    //////////  TIP 109: Withdraw excess TRIBE from the rewards system
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
      description: `Withdraw excess 150k TRIBE from Rari delegator contract. There is 164k excess, leaving behind a buffer of 14k`
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'governorWithdrawTribe(uint256)',
      arguments: (addresses) => ['26800000000000000000000000'],
      description: `
      Withdraw remaining TRIBE from the Tribal Chief to the Core Treasury, leaving behind enough to fund outstanding
      rewards.
      
      Withdrawal amount = 
      (Tribal Chief balance before harvest 
            - (pending rewards, Uniswap-v2 FEI/TRIBE LP + Curve 3crv-FEI metapool LP + G-UNI DAI/FEI 0.05% fee tier)
      
      Withdrawal amount = 27.4M - 0.60M = 26.8M  
      (There is ~564k in pending rewards, leaving behind an additional ~35k TRIBE as buffer)
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

    ///////  TIP-110: Simplify PCV, redeem agEUR /////////
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
      method: 'redeemAgEurToDai()',
      arguments: (addresses) => [],
      description: 'Redeem all agEUR for DAI and send to DAI PSM'
    },

    /////////////  CLEANUP /////////////////////
    // Unset various safe addresses - deprecated PSMs and agEurUniswapPCVDeposit
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'unsetSafeAddresses(address[])',
      arguments: (addresses) => [
        [
          addresses.ethPSM,
          addresses.lusdPSM,
          addresses.raiPriceBoundPSM,
          addresses.agEurUniswapPCVDeposit,
          addresses.aaveEthPCVDeposit,
          addresses.turboFusePCVDeposit,
          addresses.aaveRaiPCVDeposit,
          addresses.rariPool9RaiPCVDeposit,
          addresses.balancerDepositFeiWeth,
          addresses.d3poolConvexPCVDeposit,
          addresses.d3poolCurvePCVDeposit,
          addresses.compoundEthPCVDeposit,
          addresses.dpiToDaiLBPSwapper,
          addresses.uniswapPCVDeposit
        ]
      ],
      description: `
      Unset as safe addresses the deprecated PSMs along with various other deprecated 
      PCV deposits.
      `
    },

    // Remove various deposits from CR
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: (addresses) => [
        [
          addresses.agEurUniswapPCVDeposit,
          addresses.uniswapLensAgEurUniswapGauge,
          addresses.lusdPSM,
          addresses.ethPSM,
          addresses.aaveEthPCVDepositWrapper,
          addresses.voltDepositWrapper,
          addresses.turboFusePCVDeposit,
          addresses.feiOATimelockWrapper,
          addresses.rariPool128FeiPCVDepositWrapper,
          addresses.rariPool22FeiPCVDepositWrapper
        ]
      ],
      description: `
      Remove agEUR addresses, LUSD PSM, ETH PSM, Aave ETH PCV Deposit wrapper ,
      Volt deposit wrapper, Turbo Fuse PCV deposit, Fei OA timelock wrapper
      and various Rari Fuse pool wrappers from CR oracle.
      `
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

    //// Tighten DAI PSM redemption spread
    {
      target: 'daiFixedPricePSM',
      values: '0',
      method: 'setRedeemFee(uint256)',
      arguments: (addresses) => ['3'],
      description: 'Set DAI PSM redeem fee to 3bps'
    },
    {
      target: 'daiFixedPricePSM',
      values: '0',
      method: 'setMintFee(uint256)',
      arguments: (addresses) => ['3'],
      description: 'Set DAI PSM mint fee to 3bps'
    },

    //// AURA Airdrop claim & lock
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'upgrade(address,address)',
      arguments: (addresses) => [
        addresses.vlAuraDelegatorPCVDeposit,
        addresses.vlAuraDelegatorPCVDepositImplementation
      ],
      description: `Upgrade implementation of the vlAuraDelegatorPCVDeposit`
    },
    {
      target: 'vlAuraDelegatorPCVDeposit',
      values: '0',
      method: 'initialize(address,address,address)',
      arguments: (addresses) => [addresses.aura, addresses.vlAura, addresses.auraMerkleDrop],
      description: `Initialize state of vlAuraDelegatorPCVDeposit`
    },
    {
      target: 'vlAuraDelegatorPCVDeposit',
      values: '0',
      method: 'claimAirdropAndLock(bytes32[],uint256)',
      arguments: (addresses) => [
        [
          // merkle proof
          '0x7a976f1aaae92306705a851e21eca3a2b94e5f13b70ab392ab43de0772ebeec7',
          '0x5f45f18cae24e95af94aeb735804f6fa3c71737f9bb628a47aa1d10338c8f108',
          '0x048081e369fa24baee1b7a0cce66539341a6a3e82abe5f1de21a5c34c62c7059',
          '0xd161606724ac7215eb1d8401a9652d5cd674dcb87b358142e8a1c0606638a155',
          '0x95c5cd035c6d6b3d680c7f44f39762cd520ae00bb22a97b720c7a5e9f8343bb1',
          '0xe21283def28f3d19b0ca2e7d5dbc658b36ff156452caccd8b1bec0a3f8e1888d',
          '0xc0594f46556af78da13a3a6927537d3797d06d1a840809d5a1fe652104558796',
          '0x1ef501ed5c0808c30fe72e31488aedbb87cc47b6ad57d4f698834a8980828e96',
          '0x96093189d23ab1dcbc52c1ce8e66c26458fd343bf71e992a3dcddab33732f4e6',
          '0x343102ed4002e53b89598f5ef4117d269b3ac98666da0b018d37d12c3ccd3e5f',
          '0x14737b2e4f69768d546edf1c090e03113a5f4dad097fd7e618519c56405a4dc0',
          '0xc3d849f7a9528b1c7a94b37fa96daddd882b85442a136fd1a2a89b9785392b03',
          '0x885f3b9b64e16f0a6490c275896092c04f932fd1a484ba7049c7ae632e301a23'
        ],
        '23438420626218725374201' // amount
      ],
      description: `Claim AURA airdrop and lock`
    },
    {
      target: 'vlAuraDelegatorPCVDeposit',
      values: '0',
      method: 'setDelegate(address)',
      arguments: (addresses) => [addresses.eswak],
      description: `Set vlAURA delegatee`
    }
  ],
  description: `
  TIP_118: Deprecating PSMs, deprecating TRIBE incentives system, redeem agEUR

  This proposal deprecates the ETH, LUSD and RAI PSMs and completes items from TIP-109: Discontinue TRIBE
  incentives and TIP-110: Simplify PCV (redeeming all agEUR in the PCV to DAI).

  Forum post: https://tribe.fei.money/t/tip-118-psm-deprecation-incentives-withdrawal-ageur-redemption/4424 
  Code changes: https://github.com/fei-protocol/fei-protocol-core/pull/922 

  PSM deprecation
  --------------------------------------------
  The proposal deprecates the ETH, LUSD and RAI PSMs. This involves transferring all assets off these PSMs, 
  revoking their MINTER_ROLE and ensuring they are fully paused. It also pauses the the associated PCV drip controllers and 
  deprecates the Fei skimmers. Going forward, the only active PSM will be the DAI PSM.

  The DAI FEI skimmer is also activated by granting the PCV_CONTROLLER_ROLE and excess FEI burned. 
  
  In addition, a new type of PCV deposit, the ERC20HoldingPCVDeposit, is deployed. This is a deposit which has 
  the deposit() method as a no-op and is intended to just hold assets. The DAO's gOHM and VOLT assets are transferred
  from the DAO timelock to the relevant holding deposits.


  TIP-109: Deprecate TRIBE Incentives system (https://tribe.fei.money/t/tip-109-discontinue-tribe-incentives/4291)
  --------------------------------------------
  The proposal finishes the deprecation of the TRIBE incentives system by withdrawing the excess TRIBE from 
  the incentives system and deprecating the Tribal Chief contract. 

  Specifically it:
  - Withdraws remaining TRIBE from the TribalChief, leaving enough behind to fully fund existing commitments
  - Withdraws all TRIBE from 3Crv and D3 Votium briber contracts
  - Withdraws remaining TRIBE from ERC20 Dripper
  - Revokes no longer needed TRIBAL_CHIEF_ADMIN_ROLE roles

  TIP-110: Simply PCV, specifically the agEUR & Angle redemption (https://tribe.fei.money/t/tip-110-simplify-pcv/4323)
  -----------------------------------------------
  Convert all agEUR in the PCV to DAI, and deprecate all Angle Protocol-related contracts, except the contract that is holding vote-escrowed ANGLE.

  This proposal will perform the following actions :
  - Move all ANGLE rewards to TC Multisig where they can be sold
  - Unstake from Angle Protocol's Gauge all agEUR/FEI Uniswap tokens
  - Move all agEUR/FEI Uniswap tokens to PCV deposit
  - Remove all agEUR/FEI Uniswap liquidity & burn FEI
  - Redeem agEUR for DAI, and send proceeds to DAI PSM
  - Unset agEUR safe addresses & CR oracle entries

  Additional cleanup items:
  ----------------------------
  - Transfers the admin of the Aave Tribe Incentives Controller Proxy to Aave Governance
  - Claim 23k AURA airdrop and lock it for 16 weeks to avoid 30% penalty
  `
};

export default tip_118;
