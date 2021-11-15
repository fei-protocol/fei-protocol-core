// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./InterestRateModel.sol";
import "./Unitroller.sol";

interface CErc20Delegator is IERC20 {
    function _setPendingAdmin(address payable newPendingAdmin) external returns (uint);
    function _setInterestRateModel(InterestRateModel newInterestRateModel) external returns (uint);
    function _setImplementationSafe(address implementation_, bool allowResign, bytes calldata becomeImplementationData) external;
    function _becomeImplementation(bytes calldata data) external;

    function _acceptAdmin() external returns (uint);
    function mint(uint mintAmount) external returns (uint);
    function redeemUnderlying(uint underlying) external;
    function redeem(uint shares) external;
    
    function balanceOfUnderlying(address owner) external view returns (uint);
    function admin() external view returns (address);
    function pendingAdmin() external view returns (address);
    function interestRateModel() external view returns (address);
    function comptroller() external view returns (Unitroller);
}