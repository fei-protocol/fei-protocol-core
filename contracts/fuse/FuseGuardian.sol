pragma solidity ^0.8.0;

import "../refs/CoreRef.sol";
import "../external/fuse/Unitroller.sol";

/// @title a Fuse pause and borrow cap guardian used to expand access control to more Fei roles
/// @author joeysantoro
contract FuseGuardian is CoreRef {

    /// @notice the fuse comptroller
    Unitroller public immutable comptroller;

    /// @param _core address of core contract
    /// @param _comptroller the fuse comptroller
    constructor(
        address _core,
        Unitroller _comptroller
    ) CoreRef(_core) {
        comptroller = _comptroller;
        /// @notice The reason we are reusing the tribal chief admin role is it consolidates control in the OA,
        /// and means we don't have to do another governance action to create this role in core
        _setContractAdminRole(keccak256("TRIBAL_CHIEF_ADMIN_ROLE"));
    }

    // ************ BORROW GUARDIAN FUNCTIONS ************
    /**
      * @notice Set the given supply caps for the given cToken markets. Supplying that brings total underlying supply to or above supply cap will revert.
      * @dev Admin or borrowCapGuardian function to set the supply caps. A supply cap of 0 corresponds to unlimited supplying.
      * @param cTokens The addresses of the markets (tokens) to change the supply caps for
      * @param newSupplyCaps The new supply cap values in underlying to be set. A value of 0 corresponds to unlimited supplying.
      */
    function _setMarketSupplyCaps(CToken[] memory cTokens, uint[] calldata newSupplyCaps) external isGovernorOrGuardianOrAdmin {
        _setMarketSupplyCapsInternal(cTokens, newSupplyCaps);
    }

    function _setMarketSupplyCapsByUnderlying(address[] calldata underlyings, uint[] calldata newSupplyCaps) external isGovernorOrGuardianOrAdmin {
        _setMarketSupplyCapsInternal(_underlyingToCTokens(underlyings), newSupplyCaps);
    }

    function _setMarketSupplyCapsInternal(CToken[] memory cTokens, uint[] calldata newSupplyCaps) internal {
        comptroller._setMarketSupplyCaps(cTokens, newSupplyCaps);
    }

    function _underlyingToCTokens(address[] calldata underlyings) internal view returns (CToken[] memory) {
        CToken[] memory cTokens = new CToken[](underlyings.length);
        for (uint256 i = 0; i < underlyings.length; i++) {
            address cToken = comptroller.cTokensByUnderlying(underlyings[i]);
            require(cToken != address(0), "cToken doesn't exist");
            cTokens[i] = CToken(cToken);
        }
        return cTokens;
    }

    /**
      * @notice Set the given borrow caps for the given cToken markets. Borrowing that brings total borrows to or above borrow cap will revert.
      * @dev Admin or borrowCapGuardian function to set the borrow caps. A borrow cap of 0 corresponds to unlimited borrowing.
      * @param cTokens The addresses of the markets (tokens) to change the borrow caps for
      * @param newBorrowCaps The new borrow cap values in underlying to be set. A value of 0 corresponds to unlimited borrowing.
      */
    function _setMarketBorrowCaps(CToken[] memory cTokens, uint[] calldata newBorrowCaps) external isGovernorOrGuardianOrAdmin {
        _setMarketBorrowCapsInternal(cTokens, newBorrowCaps);
    }

    function _setMarketBorrowCapsInternal(CToken[] memory cTokens, uint[] calldata newBorrowCaps) internal {
        comptroller._setMarketBorrowCaps(cTokens, newBorrowCaps);
    }

    function _setMarketBorrowCapsByUnderlying(address[] calldata underlyings, uint[] calldata newBorrowCaps) external isGovernorOrGuardianOrAdmin {
        _setMarketBorrowCapsInternal(_underlyingToCTokens(underlyings), newBorrowCaps);
    }

    /**
     * @notice Admin function to change the Borrow Cap Guardian
     * @param newBorrowCapGuardian The address of the new Borrow Cap Guardian
     */
    function _setBorrowCapGuardian(address newBorrowCapGuardian) external onlyGovernor {
        comptroller._setBorrowCapGuardian(newBorrowCapGuardian);
    }

    // ************ PAUSE GUARDIAN FUNCTIONS ************
    /**
     * @notice Admin function to change the Pause Guardian
     * @param newPauseGuardian The address of the new Pause Guardian
     * @return uint 0=success, otherwise a failure. (See enum Error for details)
     */
    function _setPauseGuardian(address newPauseGuardian) external onlyGovernor returns (uint) {
        return comptroller._setPauseGuardian(newPauseGuardian);
    }

    function _setMintPausedByUnderlying(address underlying, bool state) external isGovernorOrGuardianOrAdmin returns (bool) {
        address cToken = comptroller.cTokensByUnderlying(underlying);
        require(cToken != address(0), "cToken doesn't exist");
        _setMintPausedInternal(CToken(cToken), state);
    }

    function _setMintPaused(CToken cToken, bool state) external isGovernorOrGuardianOrAdmin returns (bool) {
        return _setMintPausedInternal(cToken, state);
    }

    function _setMintPausedInternal(CToken cToken, bool state) internal returns (bool) {
        return comptroller._setMintPaused(cToken, state);
    }

    function _setBorrowPausedByUnderlying(address underlying, bool state) external isGovernorOrGuardianOrAdmin returns (bool) {
        address cToken = comptroller.cTokensByUnderlying(underlying);
        require(cToken != address(0), "cToken doesn't exist");
        return _setBorrowPausedInternal(CToken(cToken), state);
    }

    function _setBorrowPausedInternal(CToken cToken, bool state) internal returns (bool) {
        return comptroller._setBorrowPaused(cToken, state);
    }

    function _setBorrowPaused(CToken cToken, bool state) external isGovernorOrGuardianOrAdmin returns (bool) {
        _setBorrowPausedInternal(CToken(cToken), state);
    }

    function _setTransferPaused(bool state) external isGovernorOrGuardianOrAdmin returns (bool) {
        return comptroller._setTransferPaused(state);
    }

    function _setSeizePaused(bool state) external isGovernorOrGuardianOrAdmin returns (bool) {
        return comptroller._setSeizePaused(state);
    }
}