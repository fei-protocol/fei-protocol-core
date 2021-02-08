pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Pool interface
/// @author Fei Protocol
interface IPool {
    // ----------- Events -----------

    event Claim(
        address indexed _from,
        address indexed _to,
        uint256 _amountReward
    );

    event Deposit(
        address indexed _from,
        address indexed _to,
        uint256 _amountStaked
    );

    event Withdraw(
        address indexed _from,
        address indexed _to,
        uint256 _amountStaked,
        uint256 _amountReward
    );

    // ----------- State changing API -----------

    function claim(address from, address to) external returns (uint256);

    function deposit(address to, uint256 amount) external;

    function withdraw(address to)
        external
        returns (uint256 amountStaked, uint256 amountReward);

    function init() external;

    // ----------- Getters -----------

    function rewardToken() external view returns (IERC20);

    function totalReward() external view returns (uint256);

    function redeemableReward(address account)
        external
        view
        returns (uint256 amountReward, uint256 amountPool);

    function releasedReward() external view returns (uint256);

    function unreleasedReward() external view returns (uint256);

    function rewardBalance() external view returns (uint256);

    function claimedRewards() external view returns (uint256);

    function stakedToken() external view returns (IERC20);

    function totalStaked() external view returns (uint256);

    function stakedBalance(address account) external view returns (uint256);
}
