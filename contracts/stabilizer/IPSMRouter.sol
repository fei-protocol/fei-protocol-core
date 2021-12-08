pragma solidity ^0.8.4;

import "./IPegStabilityModule.sol";

interface IPSMRouter {
    // ---------- View-Only API ----------

    function psm() external returns (IPegStabilityModule);

    // ---------- State-Changing API ----------

    /// @notice Mints fei to the given address, with a minimum amount required
    /// @dev This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.
    /// @param _to The address to mint fei to
    /// @param _minAmountOut The minimum amount of fei to mint
    function mint(address _to, uint256 _minAmountOut) external payable returns (uint256);
}