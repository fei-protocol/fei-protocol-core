import { TemplatedProposalDescription } from '@custom-types/types';

const tip_121b: TemplatedProposalDescription = {
  title: 'TIP_121b: Protocol ops and technical cleanup',
  commands: [
    // 1. Cleanup LUSD->DAI Auction contracts (send dust to TC multisig for selling)
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

    // 2. Cleanup WETH->DAI Auction contracts (send dust to TC multisig for selling)
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

    // 3. Cleanup FEI/TRIBE on TC Timelock from the Rari Infra team clawback
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
  TIP_121b: Protocol ops and technical cleanup
  `
};

export default tip_121b;
