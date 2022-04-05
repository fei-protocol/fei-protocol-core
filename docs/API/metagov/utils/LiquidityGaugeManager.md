## `LiquidityGaugeManager`






### `constructor(address _gaugeController)` (internal)





### `setGaugeController(address _gaugeController)` (public)

Set the gauge controller used for gauge weight voting




### `setTokenToGauge(address token, address gaugeAddress)` (public)

Set gauge for a given token.




### `voteForGaugeWeight(address token, uint256 gaugeWeight)` (public)

Vote for a gauge's weight




### `stakeInGauge(address token, uint256 amount)` (public)

Stake tokens in a gauge




### `stakeAllInGauge(address token)` (public)

Stake all tokens held in a gauge




### `unstakeFromGauge(address token, uint256 amount)` (public)

Unstake tokens from a gauge




### `claimGaugeRewards(address gaugeAddress)` (public)

Claim rewards associated to a gauge where this contract stakes
tokens.




### `GaugeControllerChanged(address oldController, address newController)`





### `GaugeSetForToken(address token, address gauge)`





### `GaugeVote(address gauge, uint256 amount)`





### `GaugeStake(address gauge, uint256 amount)`





### `GaugeUnstake(address gauge, uint256 amount)`





### `GaugeRewardsClaimed(address gauge, address token, uint256 amount)`







