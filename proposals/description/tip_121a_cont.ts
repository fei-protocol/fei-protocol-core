import { TemplatedProposalDescription } from '@custom-types/types';

// FEI balance on the TC timelock
const TC_FEI_BALANCE = '2733169815107120096987175';

// TRIBE balance on the TC timelock
const TC_TRIBE_BALANCE = '2733170474316903966022879';

const tip_121a_cont: TemplatedProposalDescription = {
  title: 'TIP_121a (cont.): Consolidation ops and technical cleanup',
  commands: [
    // 1. Withdraw LUSD and DAI from LUSD->DAI LBP swapper, send to LUSD holding deposit
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
        addresses.lusdHoldingPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: `Move all LUSD from daiHoldingPCVDeposit to lusdHoldingPCVDeposit.`
    },
    // 2. Withdraw WETH and DAI from WETH->DAI LBP swapper, move to Lido
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
        addresses.wethHoldingPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: `Move all WETH from daiHoldingPCVDeposit to wethHoldingPCVDeposit`
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioUnwrapWETH(address,address,uint256)',
      arguments: (addresses) => [
        addresses.wethHoldingPCVDeposit, // pcvDeposit
        addresses.ethLidoPCVDeposit, // to
        '10000' // basisPoints, 100%
      ],
      description: `Move all ETH from wethHoldingPCVDeposit to ethLidoPCVDeposit to deposit()`
    },
    {
      target: 'ethLidoPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: (addresses) => [],
      description: `Deposit ETH in Lido`
    },

    // 3. Cleanup FEI/TRIBE on TC Timelock from the Rari Infra team clawback
    {
      target: 'tribe',
      values: '0',
      method: 'transferFrom(address,address,uint256)',
      arguments: (addresses) => [addresses.tribalCouncilTimelock, addresses.core, TC_TRIBE_BALANCE],
      description: 'Move all 2.7M TRIBE from TC Timelock to DAO Treasury'
    },
    {
      target: 'fei',
      values: '0',
      method: 'transferFrom(address,address,uint256)',
      arguments: (addresses) => [addresses.tribalCouncilTimelock, addresses.feiDAOTimelock, TC_FEI_BALANCE],
      description: 'Move all 2.7M FEI from TC Timelock to DAO Timelock'
    },
    {
      target: 'fei',
      values: '0',
      method: 'burn(uint256)',
      arguments: (addresses) => [TC_FEI_BALANCE],
      description: 'Burn 2.7M FEI from the DAO Timelock'
    },
    // 4. Update CR oracle to use stETH oracle for stETH rather than ETH oracle
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: (addresses) => [addresses.weth, addresses.chainlinkStEthUsdOracleWrapper],
      description: 'Update the ETH oracle in the CR oracle, to the stETH oracle as remaining ETH will be stETH'
    },
    // 5. Update CR oracle
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: (addresses) => [[addresses.lusdHoldingPCVDeposit]],
      description: 'Add smart contracts to CR Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: (addresses) => [
        [
          addresses.aaveFeiPCVDepositWrapper,
          addresses.compoundFeiPCVDepositWrapper,
          addresses.lusdToDaiLensLusd,
          addresses.lusdToDaiLensDai,
          addresses.tribalCouncilTimelockFeiLens
        ]
      ],
      description: 'Remove deprecated/empty smart contracts from CR Oracle'
    },
    // 6. Remove non-needed safe addresses
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'unsetSafeAddresses(address[])',
      arguments: (addresses) => [[addresses.voltHoldingPCVDeposit, addresses.gOHMHoldingPCVDeposit]],
      description: 'Remove deprecated contract safe addresses from PCV Guardian'
    }
  ],
  description: `
  TIP-121a (cont.): Consolidation ops and technical cleanup

  This proposal performs various protocol cleanup actions related to the Consolidation step of TIP-121, including:

  Cleanup auction contracts
  ------------------------------
  Cleans up the LUSD->DAI and WETH->DAI auction contracts that were used to sell those assets by withdrawing remaining liquidity.
  Sends the DAI to the DAI Holding deposit, last LUSD to the LUSD holding deposit, and deposit the last 50-100 WETH in Lido for simplicity. 

  Remove remaining assets from the Tribal Council Timelock
  ---------------------------------------------------------
  Burns the 2.7M FEI previously clawed back from the Rari Infrastructure team timelock and sends the 
  2.7M TRIBE also recovered to the DAO Treasury.

  Oracle and PCV maintenance
  ----------------------------------
  Performs several collaterization oracle and PCV updates:
  1. Updates the ETH oracle use a stETH/USD price feed, as remaining ETH-denominated PCV will be stETH
  2. Removes deprecated and empty contracts from the oracle
  3. Removes now deprecated contracts from being marked as safe deposit addresses
  `
};

export default tip_121a_cont;
