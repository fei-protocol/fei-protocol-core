import { TemplatedProposalDescription } from '@custom-types/types';

const deprecate_incentives: TemplatedProposalDescription = {
  title: 'TIP-114: Deprecate TRIBE Incentives system',
  commands: [
    // Harvest staking token wrappers so the ARDs are fully funded
    ///////////////  PERFORM OUTSIDE OF PROPOSAL FIRST /////////////////
    {
      target: 'stakingTokenWrapperRari',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the FeiRari: TRIBE staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperGROLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: GRO staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperFOXLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: FOX staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperUMALaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: UMA staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperSYNLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: SYN staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperNEARLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: NEAR staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperKYLINLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: KYLIN staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperMStableLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: MStable staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperPoolTogetherLaaS',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the LaaS: PoolTogether staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperBribeD3pool',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the Votium bribes: d3pool staking token wrapper to fund deposit'
    },
    {
      target: 'd3StakingTokenWrapper',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the FeiRari: d3Pool LP staking token wrapper to fund deposit'
    },
    {
      target: 'fei3CrvStakingtokenWrapper',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the FeiRari: 3crv-FEI metapool LP staking token wrapper to fund deposit'
    },
    {
      target: 'feiDaiStakingTokenWrapper',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the FeiRari: G-UNI DAI/FEI 0.05% fee tier staking token wrapper to fund deposit'
    },
    {
      target: 'feiUsdcStakingTokenWrapper',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: 'Harvest the FeiRari: G-UNI USDC/FEI 0.01% fee tier staking token wrapper to fund deposit'
    },
    {
      target: 'stakingTokenWrapperBribe3Crvpool',
      values: '0',
      method: 'harvest()',
      arguments: (addresses) => [],
      description: `
      Harvest the Votium bribes: 3crv-FEI metapool staking token wrapper to fund deposit. This will
      harvest 1.5M TRIBE and send it to the votiumBriber contract for the 3Crv-pool. This will then later be harvested.

      Harvested here to remove any possibility that the harvest is conducted during the DAO vote and the withdrawal amount is 
      incorrect. Later withdrawn from the VotiumBriber contract.
      `
    },
    ////////////   END OF PERFORM OUTSIDE OF PROPOSAL FIRST  ///////////////////

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
      arguments: (addresses) => [addresses.core, '164000000000000000000000'],
      description: `Withdraw excess 164k TRIBE from Rari delegator contract`
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'governorWithdrawTribe(uint256)',
      arguments: (addresses) => ['26833947775112516867325654'], // TODO: Update if do the harvests before this script
      description: `
      Withdraw remaining TRIBE from the Tribal Chief to the Core Treasury. 
      
      Withdrawal amount = 
      (Tribal Chief balance before harvest 
          - staking token wrapper harvested TRIBE
            - (pending rewards, Uniswap-v2 FEI/TRIBE LP + Curve 3crv-FEI metapool LP + G-UNI DAI/FEI 0.05% fee tier)
      
      Withdrawal amount = 29.2M - 1.8M - 565k = 26.8M
      `
    },

    /// Transfer TRIBE clawed back by DAO in FIP-113 to the Core Treasury
    {
      target: 'tribe',
      values: '0',
      method: 'transferFrom(address,address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, addresses.core, '16928757542558284368284929'],
      description: 'Transfer TRIBE clawed back by FIP-113 to the Core Treasury'
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
    }
  ],
  description: `
  TIP-114: Deprecate TRIBE Incentives system

  Deprecates the TRIBE incentives system according to proposal: 

  Specifically it:
  - Fully funds all remaining auto reward distributors via their staking token wrappers
  - Withdraws remaining TRIBE from the TribalChief, leaving enough behind to fully fund existing commitments
  - Withdraws all TRIBE from 3Crv and D3 Votium briber contracts
  - Withdraws remaining TRIBE from ERC20 Dripper
  - Moves previously clawed back TRIBE from the TRIBE DAO timelock to the Core Treasury
  - Transfers the admin of the Aave Fei Incentives Controller Proxy to Aave Governance
  `
};

export default deprecate_incentives;
