import { TribalChiefConfig } from '../types/types';

const config: TribalChiefConfig = {
  feiTribePair: { allocPoint: 0, unlocked: true }, // Uniswap-v2 FEI/TRIBE LP, 0 (poolId)
  curve3Metapool: { allocPoint: 0, unlocked: true }, // Curve 3crv-FEI metapool LP, 1
  gUniFeiDaiLP: { allocPoint: 0, unlocked: true }, // G-UNI DAI/FEI 0.05% fee tier, 2
  stakingTokenWrapperRari: { allocPoint: 1, unlocked: true }, // FeiRari: TRIBE, 3
  stakingTokenWrapperGROLaaS: { allocPoint: 0, unlocked: true }, // LaaS: GRO, 4
  stakingTokenWrapperFOXLaaS: { allocPoint: 0, unlocked: true }, // LaaS: FOX, 5
  stakingTokenWrapperUMALaaS: { allocPoint: 0, unlocked: true }, // LaaS: UMA, 6
  stakingTokenWrapperSYNLaaS: { allocPoint: 0, unlocked: true }, // LaaS: SYN, 7
  stakingTokenWrapperNEARLaaS: { allocPoint: 0, unlocked: true }, // LaaS: NEAR, 8
  stakingTokenWrapperKYLINLaaS: { allocPoint: 0, unlocked: true }, // LaaS: KYLIN, 9
  stakingTokenWrapperMStableLaaS: { allocPoint: 0, unlocked: true }, // LaaS: MStable, 10
  stakingTokenWrapperPoolTogetherLaaS: { allocPoint: 0, unlocked: true }, // LaaS: PoolTogether, 11
  stakingTokenWrapperBribeD3pool: { allocPoint: 0, unlocked: true }, // Votium bribes: d3pool, 12
  d3StakingTokenWrapper: { allocPoint: 0, unlocked: true }, // FeiRari: d3pool LP, 13
  fei3CrvStakingtokenWrapper: { allocPoint: 0, unlocked: true }, // FeiRari: 3crv-FEI metapool LP, 14
  feiDaiStakingTokenWrapper: { allocPoint: 0, unlocked: true }, // FeiRari: G-UNI DAI/FEI 0.05% fee tier, 15
  feiUsdcStakingTokenWrapper: { allocPoint: 0, unlocked: true }, // FeiRari: G-UNI USDC/FEI 0.01% fee tier, 16
  stakingTokenWrapperBribe3Crvpool: { allocPoint: 0, unlocked: true } // Votium bribes: 3crv-FEI metapool, 17
};

export default config;
