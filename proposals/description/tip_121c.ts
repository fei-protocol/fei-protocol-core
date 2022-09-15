import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_121c: TemplatedProposalDescription = {
  title: 'TIP-121: PCV Consolidation (phase 1.c)',
  commands: [
    // 1. DAI : deprecate old psm, setup new psm, move all DAI to new psm.
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
    // 1.b Setup the new DAI PSM
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: (addresses) => [addresses.simpleFeiDaiPSM],
      description: `Grant MINTER role to the new DAI PSM`
    },
    // 1.c Migrate all DAI funds to the new DAI PSM
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [
        addresses.daiFixedPricePSM, // from
        addresses.simpleFeiDaiPSM, // to
        '10000' // basisPoints, 100%
      ],
      description: 'Migrate DAI from old to new DAI PSM'
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
      description: 'Migrate FEI from old to new DAI PSM'
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

    // 3. Final handling of veBAL : tokenize it (for redemptions) and deprecate all related contracts
    // Grant METAGOVERNANCE_TOKEN_STAKING + PCV_CONTROLLER_ROLE role to an immutable contract (that is an ERC20 of
    // tokenized veBAL), and have a call in this contract that can be used to unlock veBAL and pull to self
    // with withdrawERC20, and another to burn the token itself for redeeming B-80BAL-20WETH after they
    // have been pulled to the contract.

    // 4. Final handling of veANGLE : nothing to do (write it off).
    // angleDelegatorPCVDeposit has 478,096.47 ANGLE Locked Until Apr 2nd 2026 (3.623 y)
    // worth $ 22,288 on 18 Aug 2022 + ~5k€ of unclaimed sanUSDC_EUR fees.
    // angleDelegatorPCVDeposit is not a proxy so we can't change the hardcoded behavior.

    // Finally, Collateralization Oracle and Safe Addresses updates
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
