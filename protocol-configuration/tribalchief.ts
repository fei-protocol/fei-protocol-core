import { TribalChiefConfig } from '../types/types';

const config: TribalChiefConfig = {
  feiTribePair: { allocPoint: 0, unlocked: false }, // Uniswap-v2 FEI/TRIBE LP
  curve3Metapool: { allocPoint: 0, unlocked: false }, // Curve 3crv-FEI metapool LP
  gUniFeiDaiLP: { allocPoint: 0, unlocked: true }, // G-UNI DAI/FEI 0.05% fee tier
  stakingTokenWrapperRari: { allocPoint: 1000, unlocked: false }, // FeiRari: TRIBE
  stakingTokenWrapperGROLaaS: { allocPoint: 0, unlocked: false }, // LaaS: GRO
  stakingTokenWrapperFOXLaaS: { allocPoint: 0, unlocked: false }, // LaaS: FOX
  stakingTokenWrapperUMALaaS: { allocPoint: 0, unlocked: false }, // LaaS: UMA
  stakingTokenWrapperSYNLaaS: { allocPoint: 0, unlocked: false }, // LaaS: SYN
  stakingTokenWrapperNEARLaaS: { allocPoint: 0, unlocked: false }, // LaaS: NEAR
  stakingTokenWrapperKYLINLaaS: { allocPoint: 0, unlocked: false }, // LaaS: KYLIN
  stakingTokenWrapperMStableLaaS: { allocPoint: 0, unlocked: false }, // LaaS: MStable
  stakingTokenWrapperPoolTogetherLaaS: { allocPoint: 0, unlocked: false }, // LaaS: PoolTogether
  stakingTokenWrapperBribeD3pool: { allocPoint: 250, unlocked: false }, // Votium bribes: d3pool
  d3StakingTokenWrapper: { allocPoint: 250, unlocked: false }, // FeiRari: d3pool LP
  fei3CrvStakingtokenWrapper: { allocPoint: 1000, unlocked: false }, // FeiRari: 3crv-FEI metapool LP
  feiDaiStakingTokenWrapper: { allocPoint: 100, unlocked: false }, // FeiRari: G-UNI DAI/FEI 0.05% fee tier
  feiUsdcStakingTokenWrapper: { allocPoint: 500, unlocked: false }, // FeiRari: G-UNI USDC/FEI 0.01% fee tier
  stakingTokenWrapperBribe3Crvpool: { allocPoint: 250, unlocked: false } // Votium bribes: 3crv-FEI metapool
};

export default config;
