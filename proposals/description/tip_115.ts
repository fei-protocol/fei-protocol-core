import { TemplatedProposalDescription } from '@custom-types/types';

const tip_115: TemplatedProposalDescription = {
  title: 'TIP-115: Collateralization and Operations Updates',
  commands: [
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: (addresses) => [addresses.rariTimelockFeiOldLens],
      description: 'Add FEI lens to CR oracle for old timelocked FEI'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: (addresses) => [addresses.tribalCouncilTimelockFeiLens],
      description: 'Add FEI lens to CR oracle for tribal council timelock FEI'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: (addresses) => [addresses.namedStaticPCVDepositWrapper],
      description: 'Remove NamedStaticPCVDepositWrapper from CR oracle'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: (addresses) => [1],
      description: 'Remove NamedStaticPCVDepositWrapper FEI deposit'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: (addresses) => [0],
      description: 'Remove NamedStaticPCVDepositWrapper INDEX deposit'
    },
    {
      target: 'rariInfraFeiTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary of rari infra fei timelock'
    },
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary of rari infra tribe timelock'
    },

    //// Trigger new LBP of ETH
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: (addresses) => [
        addresses.daiFixedPricePSM,
        addresses.ethToDaiLBPSwapper,
        '1000000000000000000000000',
        false,
        false
      ],
      description: 'Withdraw 1M DAI to LBP Swapper'
    },
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: (addresses) => [
        addresses.ethPSM,
        addresses.ethToDaiLBPSwapper,
        '10000000000000000000000',
        false,
        false
      ],
      description: 'Withdraw 10k ETH to LBP Swapper'
    },
    {
      target: 'ethToDaiLBPSwapper',
      values: '0',
      method: 'swap()',
      arguments: (addresses) => [],
      description: 'Trigger new ETH LBP swap'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: (addresses) => [
        '0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816', // SWAP_ADMIN_ROLE
        addresses.tribalCouncilSafe
      ],
      description: 'Grant SWAP_ADMIN_ROLE to Tribal Council multisig'
    }
  ],
  description: `Executes a few cleanup actions related to collateralization and operations:
  1. Add a collateralization FEI lens to the FEI in the tribal council timelock and old rari timelocks
  2. Accept beneficiary of the old rari timelocks to tribal council timelock.  
  3. Remove deprecated namedStaticPCVDeposit from collateralization oracle. 
  4. Trigger new ETH LBP to convert 10k ETH to DAI.
  5. Grant tribal council safe the SWAP_ADMIN_ROLE to initiate LBPs after governance funds them.
  `
};

export default tip_115;
