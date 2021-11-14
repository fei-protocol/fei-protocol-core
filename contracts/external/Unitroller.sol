// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./CToken.sol";

abstract contract Unitroller {

    struct Market {
        bool isListed;
        uint collateralFactorMantissa;
        mapping(address => bool) accountMembership;
    }
    
    address public admin;
    address public pendingAdmin;
    uint public closeFactorMantissa;
    uint public liquidationIncentiveMantissa;
    mapping(address => Market) public markets;
    function _setPendingAdmin(address newPendingAdmin) public virtual returns (uint); 
    function _setCloseFactor(uint newCloseFactorMantissa) external virtual returns (uint256);
    function _setLiquidationIncentive(uint newLiquidationIncentiveMantissa) external virtual returns (uint);
    function _setCollateralFactor(CToken cToken, uint newCollateralFactorMantissa) public virtual returns (uint256);
    function _setBorrowPaused(CToken cToken, bool borrowPaused) external virtual;
    function _acceptAdmin() external virtual returns (uint);
    function borrowGuardianPaused(address cToken) external view virtual returns(bool);
    function comptrollerImplementation() external view virtual returns(address);
    function rewardsDistributors(uint256 index) external view virtual returns(address);

    function fuseAdminHasRights() external view virtual returns(bool);
    function adminHasRights() external view virtual returns(bool);

}