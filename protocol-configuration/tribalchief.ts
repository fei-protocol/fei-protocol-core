import { TribalChiefConfig } from '../types/types';

const config: TribalChiefConfig = {
  feiTribePair: { allocPoint: 0, unlocked: true }, // Uniswap-v2 FEI/TRIBE LP
  curve3Metapool: { allocPoint: 0, unlocked: true }, // Curve 3crv-FEI metapool LP
  gUniFeiDaiLP: { allocPoint: 0, unlocked: true }, // G-UNI DAI/FEI 0.05% fee tier
  stakingTokenWrapperRari: { allocPoint: 1, unlocked: true }, // FeiRari: TRIBE
  stakingTokenWrapperGROLaaS: { allocPoint: 0, unlocked: true }, // LaaS: GRO
  stakingTokenWrapperFOXLaaS: { allocPoint: 0, unlocked: true }, // LaaS: FOX
  stakingTokenWrapperUMALaaS: { allocPoint: 0, unlocked: true }, // LaaS: UMA
  stakingTokenWrapperSYNLaaS: { allocPoint: 0, unlocked: true }, // LaaS: SYN
  stakingTokenWrapperNEARLaaS: { allocPoint: 0, unlocked: true }, // LaaS: NEAR
  stakingTokenWrapperKYLINLaaS: { allocPoint: 0, unlocked: true }, // LaaS: KYLIN
  stakingTokenWrapperMStableLaaS: { allocPoint: 0, unlocked: true }, // LaaS: MStable
  stakingTokenWrapperPoolTogetherLaaS: { allocPoint: 0, unlocked: true }, // LaaS: PoolTogether
  stakingTokenWrapperBribeD3pool: { allocPoint: 0, unlocked: true }, // Votium bribes: d3pool
  d3StakingTokenWrapper: { allocPoint: 0, unlocked: true }, // FeiRari: d3pool LP
  fei3CrvStakingtokenWrapper: { allocPoint: 0, unlocked: true }, // FeiRari: 3crv-FEI metapool LP
  feiDaiStakingTokenWrapper: { allocPoint: 0, unlocked: true }, // FeiRari: G-UNI DAI/FEI 0.05% fee tier
  feiUsdcStakingTokenWrapper: { allocPoint: 0, unlocked: true }, // FeiRari: G-UNI USDC/FEI 0.01% fee tier
  stakingTokenWrapperBribe3Crvpool: { allocPoint: 0, unlocked: true } // Votium bribes: 3crv-FEI metapool
};

export default config;
