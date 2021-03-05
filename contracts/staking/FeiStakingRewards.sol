pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/StakingRewardsV2.sol";

/// @title A StakingRewards contract for earning TRIBE with staked FEI/TRIBE LP tokens
/// @author Fei Protocol
/// @notice deposited LP tokens will earn TRIBE over time at a linearly decreasing rate
contract FeiStakingRewards is StakingRewardsV2 {
    constructor(
        address _distributor,
        address _tribe,
        address _pair,
        uint256 _duration
    ) public 
        StakingRewardsV2(_distributor, _tribe, _pair, _duration) 
    {}
}
