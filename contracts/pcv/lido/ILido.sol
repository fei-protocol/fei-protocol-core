// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

// stETH Token contract specific functions
interface ILido {
    function getTotalShares() external view returns (uint256);
    function getTotalPooledEther() external view returns (uint256);
    function sharesOf(address _account) external view returns (uint256);
    function getSharesByPooledEth(uint256 _ethAmount) external view returns (uint256);
    function getPooledEthByShares(uint256 _sharesAmount) external view returns (uint256);
    function getFee() external view returns (uint256);
    function increaseAllowance(address _spender, uint256 _addedValue) external returns (bool);
    function decreaseAllowance(address _spender, uint256 _subtractedValue) external returns (bool);
    function submit(address referral) external payable returns (uint256);
}
