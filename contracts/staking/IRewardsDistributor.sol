pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IStakingRewards.sol";

/// @title Rewards Distributor interface
/// @author Fei Protocol
interface IRewardsDistributor {
    // ----------- Events -----------

    event Drip(
        address indexed _caller,
        uint256 _amount
    );

    event TribeWithdraw(
        uint256 _amount
    );

    event FrequencyUpdate(
        uint256 _frequency
    );

    event IncentiveUpdate(
        uint256 _incentiveAmount
    );

    event StakingContractUpdate(
        address _stakingContract
    );

    // ----------- State changing API -----------

    function drip() external returns (uint256);

    // ----------- Governor-only changing API -----------

    function governorWithdrawTribe(uint256 amount) external;

    function governorRecover(address tokenAddress, address to, uint256 amount) external;

    function setDripFrequency(uint256 _frequency) external;

    function setIncentiveAmount(uint256 _incentiveAmount) external;

    function setStakingContract(address _stakingRewards) external;

    // ----------- Getters -----------

    function totalReward() external view returns (uint256);

    function releasedReward() external view returns (uint256);

    function unreleasedReward() external view returns (uint256);

    function rewardBalance() external view returns (uint256);

    function distributedRewards() external view returns (uint256);

    function stakingContract() external view returns (IStakingRewards);

    function lastDistributionTime() external view returns (uint256);

    function isDripAvailable() external view returns (bool);

    function nextDripAvailable() external view returns (uint256);

    function dripFrequency() external view returns (uint256);

    function incentiveAmount() external view returns (uint256);
}
