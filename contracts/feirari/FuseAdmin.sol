// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./FuseGuardian.sol";
import "./IMasterOracle.sol";

contract FuseAdmin is FuseGuardian {

    error ComptrollerError();

    /// @param _core address of core contract
    /// @param _comptroller the fuse comptroller
    constructor(
        address _core,
        Unitroller _comptroller
    ) FuseGuardian(_core, _comptroller) {}

    function oracleAdd(address[] calldata underlyings, address[] calldata _oracles) external onlyGovernorOrAdmin {
        IMasterOracle(comptroller.oracle()).add(underlyings, _oracles);
    }

    function oracleChangeAdmin(address newAdmin) external onlyGovernor {
        IMasterOracle(comptroller.oracle()).changeAdmin(newAdmin);
    }

    function _addRewardsDistributor(address distributor) external onlyGovernorOrAdmin {
        if (comptroller._addRewardsDistributor(distributor) != 0) revert ComptrollerError();
    }

    function _setWhitelistEnforcement(bool enforce) external onlyGovernorOrAdmin {
        if (comptroller._setWhitelistEnforcement(enforce) !=0) revert ComptrollerError();
    }

    function _setWhitelistStatuses(address[] calldata suppliers, bool[] calldata statuses) external onlyGovernorOrAdmin {
        if (comptroller._setWhitelistStatuses(suppliers, statuses) !=0) revert ComptrollerError();
    }

    function _setPriceOracle(address newOracle) public onlyGovernor {
        if (comptroller._setPriceOracle(newOracle) !=0) revert ComptrollerError();
    }

    function _setCloseFactor(uint newCloseFactorMantissa) external onlyGovernorOrAdmin {
        if (comptroller._setCloseFactor(newCloseFactorMantissa) !=0) revert ComptrollerError();
    }

    function _setCollateralFactor(CToken cToken, uint newCollateralFactorMantissa) public onlyGovernorOrAdmin {
        if (comptroller._setCollateralFactor(cToken, newCollateralFactorMantissa) !=0) revert ComptrollerError();
    }

    function _setLiquidationIncentive(uint newLiquidationIncentiveMantissa) external onlyGovernorOrAdmin {
        if (comptroller._setLiquidationIncentive(newLiquidationIncentiveMantissa) !=0) revert ComptrollerError();
    }

    function _deployMarket(
        address underlying,
        address irm,
        string calldata name,
        string calldata symbol,
        address impl,
        bytes calldata data,
        uint256 reserveFactor,
        uint256 adminFee,
        uint256 collateralFactorMantissa
    ) external onlyGovernorOrAdmin {
        bytes memory constructorData = abi.encode(
            underlying,
            address(comptroller),
            irm,
            name,
            symbol,
            impl,
            data,
            reserveFactor,
            adminFee
        );

        if (comptroller._deployMarket(false, constructorData, collateralFactorMantissa) != 0) revert ComptrollerError();
    }

    function _unsupportMarket(CToken cToken) external onlyGovernorOrAdmin {
        if (comptroller._unsupportMarket(cToken) !=0) revert ComptrollerError();
    }

    function _toggleAutoImplementations(bool enabled) public onlyGovernorOrAdmin {
        if (comptroller._toggleAutoImplementations(enabled) !=0) revert ComptrollerError();
    }

    function _setPendingAdmin(address newPendingAdmin) public onlyGovernorOrAdmin {
        if (comptroller._setPendingAdmin(newPendingAdmin) !=0) revert ComptrollerError();
    }

    function _acceptAdmin() public {
        if(comptroller._acceptAdmin() != 0) revert ComptrollerError();
    }   
}