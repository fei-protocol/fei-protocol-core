import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// User circulating Fei: 63.5M
// DAI from old PSM: 6.5M
// DAI transfer amount from holding deposit: 57M

// TODO: Update when final approx user circulating FEI is known
const DAI_TRANSFER_AMOUNT_FROM_HOLDING = ethers.constants.WeiPerEther.mul(57_000_000);

const tip_121c: TemplatedProposalDescription = {
  title: 'TIP-121: PCV Consolidation (phase 1.c)',
  commands: [
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
      target: 'core',
      values: '0',
      method: 'revokePCVController(address)',
      arguments: (addresses) => [addresses.daiPCVDripController],
      description: `Revoke PCV_CONTROLLER role from the old DAI PSM drip controller`
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
      description: 'Migrate all DAI from old to new DAI PSM (~14M)'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [addresses.simpleFeiDaiPSM, DAI_TRANSFER_AMOUNT_FROM_HOLDING],
      description: 'Withdraw 57M DAI from DAI holding deposit to the simple FEI DAI PSM'
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
    }
  ],
  description: `
  TIP-121: PCV Consolidation (phase 1.c)

  TODO
  `
};

export default tip_121c;
