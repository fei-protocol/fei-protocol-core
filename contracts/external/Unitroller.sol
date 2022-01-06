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
    address public borrowCapGuardian;
    address public pauseGuardian;

    address public oracle;
    address public pendingAdmin;
    uint public closeFactorMantissa;
    uint public liquidationIncentiveMantissa;
    mapping(address => Market) public markets;
    mapping(address => address) public cTokensByUnderlying;
    mapping(address => uint) public supplyCaps;

    function _setPendingAdmin(address newPendingAdmin) public virtual returns (uint); 

    function _setBorrowCapGuardian(address newBorrowCapGuardian) public virtual;
    function _setMarketSupplyCaps(CToken[] calldata cTokens, uint[] calldata newSupplyCaps) external virtual;
    function _setMarketBorrowCaps(CToken[] calldata cTokens, uint[] calldata newBorrowCaps) external virtual;

    function _setPauseGuardian(address newPauseGuardian) public virtual returns (uint);
    function _setMintPaused(CToken cToken, bool state) public virtual returns (bool);
    function _setBorrowPaused(CToken cToken, bool borrowPaused) public virtual returns (bool);
    function _setTransferPaused(bool state) public virtual returns (bool);
    function _setSeizePaused(bool state) public virtual returns (bool);

    function _setPriceOracle(address newOracle) external virtual returns (uint256);
    function _setCloseFactor(uint newCloseFactorMantissa) external virtual returns (uint256);
    function _setLiquidationIncentive(uint newLiquidationIncentiveMantissa) external virtual returns (uint);
    function _setCollateralFactor(CToken cToken, uint newCollateralFactorMantissa) public virtual returns (uint256);
    function _acceptAdmin() external virtual returns (uint);
    function _deployMarket(bool isCEther, bytes calldata constructionData, uint256 collateralFactorMantissa) external virtual returns (uint);
    function borrowGuardianPaused(address cToken) external view virtual returns(bool);
    function comptrollerImplementation() external view virtual returns(address);
    function rewardsDistributors(uint256 index) external view virtual returns(address);
}