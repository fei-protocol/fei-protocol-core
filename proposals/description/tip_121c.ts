import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// User circulating Fei: 58.7M
// DAI from old PSM: 7.2M
// DAI transfer amount from holding deposit: 51.5M
// TODO: Update when final approx user circulating FEI is known
const PSM_DAI_TRANSFER_FROM_DEPOSIT = ethers.constants.WeiPerEther.mul(51_450_791);

// Tribe Redeemer, asset amount configuration
const MAX_BASIS_POINTS = '10000'; // 100% in basis points
const DAO_TIMELOCK_FOX_BALANCE = '15316691965631380244403204';
const DAO_TIMELOCK_LQTY_BALANCE = '1101298805118942906652299';

const tip_121c: TemplatedProposalDescription = {
  title: 'TIP-121c: Final redemptions',
  commands: [
    ////////////////////   SIMPLE FEI PSM ////////////////////////
    // 1. DAI : deprecate old psm, setup new psm, move enough DAI to new psm to cover
    // user circulating FEI
    // 1.a Deprecate the old DAI PSM
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: (addresses) => [addresses.daiFixedPricePSM],
      description: `Revoke MINTER role from the old DAI PSM`
    },
    {
      target: 'core',
      values: '0',
      method: 'revokePCVController(address)',
      arguments: (addresses) => [addresses.daiFixedPricePSMFeiSkimmer],
      description: `Revoke PCV_CONTROLLER role from the old DAI PSM skimmer`
    },
    {
      target: 'daiFixedPricePSMFeiSkimmer',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: `Pause DAI PSM Fei skimmer`
    },
    {
      target: 'core',
      values: '0',
      method: 'revokePCVController(address)',
      arguments: (addresses) => [addresses.daiPCVDripController],
      description: `Revoke PCV_CONTROLLER role from the old DAI PSM drip controller`
    },
    {
      target: 'daiPCVDripController',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: `Pause DAI PCV drip controller`
    },
    // Pause old DAI PSM
    {
      target: 'daiFixedPricePSM',
      values: '0',
      method: 'pause()',
      arguments: (addresses) => [],
      description: `Pause old DAI PSM`
    },
    {
      target: 'daiFixedPricePSM',
      values: '0',
      method: 'pauseMint()',
      arguments: (addresses) => [],
      description: `Pause minting on old DAI PSM`
    },
    {
      target: 'daiFixedPricePSM',
      values: '0',
      method: 'pauseRedeem()',
      arguments: (addresses) => [],
      description: `Pause redeeming on old DAI PSM`
    },
    // 1.b Setup the new DAI PSM
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: (addresses) => [addresses.simpleFeiDaiPSM],
      description: `Grant MINTER role to the new DAI PSM`
    },
    // 1.c Migrate enough DAI funds to the new DAI PSM to cover circulating FEI
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [
        addresses.daiFixedPricePSM, // from
        addresses.simpleFeiDaiPSM, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate all DAI from old to new DAI PSM (~7.2M)'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [addresses.simpleFeiDaiPSM, PSM_DAI_TRANSFER_FROM_DEPOSIT],
      description: 'Withdraw 51.5M DAI from DAI holding deposit to the simple FEI DAI PSM'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.daiFixedPricePSM, // from
        addresses.fei, // token
        addresses.simpleFeiDaiPSM, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate FEI from old to new DAI PSM, where it will then be burned'
    },
    {
      target: 'simpleFeiDaiPSM',
      values: '0',
      method: 'burnFeiHeld()',
      arguments: (addresses) => [],
      description: 'Burn FEI held on the new DAI PSM'
    },

    // 2. Revoke deprecated MINTER_ROLE role from timelock
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: (addresses) => [addresses.feiDAOTimelock],
      description: 'Revoke MINTER_ROLE from the DAO Timelock.'
    },

    // 3. Update Collateralization Oracle and Safe Addresses
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: (addresses) => [addresses.daiFixedPricePSM, addresses.simpleFeiDaiPSM],
      description: 'Swap old for new DAI PSM in CR Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: (addresses) => [addresses.rariPool79FeiPCVDepositWrapper],
      description: 'Remove now empty rariPool79FeiPCVDepositWrapper from CR'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddresses(address[])',
      arguments: (addresses) => [[addresses.simpleFeiDaiPSM]],
      description: 'Set new safe addresses'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'unsetSafeAddresses(address[])',
      arguments: (addresses) => [
        [
          addresses.daiFixedPricePSM,
          addresses.balancerDepositBalWeth,
          addresses.veBalDelegatorPCVDeposit,
          addresses.balancerGaugeStaker,
          addresses.ethToDaiLBPSwapper,
          addresses.wethHoldingPCVDeposit,
          addresses.lusdHoldingPCVDeposit,
          addresses.daiHoldingPCVDeposit
        ]
      ],
      description: 'Unset all safe addresses (only DAO timelock and SimpleFeiDaiPSM that acts as a sink)'
    },

    /// 4. Repoint Fuse withdrawal guard to the redemption contract
    {
      target: 'fuseWithdrawalGuard',
      values: '0',
      method: 'setWithdrawInfo(address,(address,address,uint96))',
      arguments: (addresses) => [addresses.rariPool8FeiPCVDeposit, [addresses.simpleFeiDaiPSM, addresses.fei, '0']],
      description: 'Update Fuse Withdrawal Guard for FEI destination to simpleFeiDaiPSM'
    },
    {
      target: 'fuseWithdrawalGuard',
      values: '0',
      method: 'setWithdrawInfo(address,(address,address,uint96))',
      arguments: (addresses) => [addresses.rariPool8DaiPCVDeposit, [addresses.simpleFeiDaiPSM, addresses.dai, '0']],
      description: 'Update Fuse Withdrawal Guard for DAI destination to simpleFeiDaiPSM'
    },

    /// 5. Send all LUSD, BAL and bbaUSD to Tribal Council Multisig for selling
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.lusdHoldingPCVDeposit, // from
        addresses.lusd, // token
        addresses.tribalCouncilSafe, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Withdraw remaining LUSD ~17k to Tribal Council Safe for selling'
    },

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

    ////////////////////   TRIBE REDEEMER   ////////////////////////
    // 6. Transfer PCV assets to TribeRedeemer for redemption
    // stETH
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.ethLidoPCVDeposit,
        addresses.steth,
        addresses.tribeRedeemer,
        MAX_BASIS_POINTS
      ],
      description: 'Withdraw all 50.3k stETH from Lido deposit to the Tribe Redeemer'
    },
    // DAI
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.daiHoldingPCVDeposit,
        addresses.dai,
        addresses.tribeRedeemer,
        MAX_BASIS_POINTS
      ],
      description: 'Withdraw all ~30M DAI from holding deposit to the Tribe Redeemer'
    },
    // FOX
    {
      target: 'fox',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.tribeRedeemer, DAO_TIMELOCK_FOX_BALANCE],
      description: 'Send all 15.3M FOX to the Tribe Redeemer'
    },
    // LQTY
    {
      target: 'lqty',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.tribeRedeemer, DAO_TIMELOCK_LQTY_BALANCE],
      description: 'Send all 1.1M LQTY to the Tribe Redeemer'
    }
  ],
  description: `
  TIP-121c: Final redemptions

  TODO
  `
};

export default tip_121c;
