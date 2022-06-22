pragma solidity ^0.8.4;

import "./IPegStabilityModule.sol";
import "../fei/IFei.sol";

interface IPSMRouter {
    // ---------- View-Only API ----------

    /// @notice reference to the PegStabilityModule that this router interacts with
    function psm() external returns (IPegStabilityModule);

    /// @notice reference to the FEI contract used.
    function fei() external returns (IFei);

    /// @notice calculate the amount of FEI out for a given `amountIn` of underlying
    function getMintAmountOut(uint256 amountIn) external view returns (uint256 amountFeiOut);

    /// @notice calculate the amount of underlying out for a given `amountFeiIn` of FEI
    function getRedeemAmountOut(uint256 amountFeiIn) external view returns (uint256 amountOut);

    /// @notice the maximum mint amount out
    function getMaxMintAmountOut() external view returns (uint256);

    /// @notice the maximum redeem amount out
    function getMaxRedeemAmountOut() external view returns (uint256);

    // ---------- State-Changing API ----------

    /// @notice Mints fei to the given address, with a minimum amount required
    /// @dev This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.
    /// @param _to The address to mint fei to
    /// @param _minAmountOut The minimum amount of fei to mint
    function mint(
        address _to,
        uint256 _minAmountOut,
        uint256 ethAmountIn
    ) external payable returns (uint256);

    /// @notice Redeems fei for ETH
    /// First pull user FEI into this contract
    /// Then call redeem on the PSM to turn the FEI into weth
    /// Withdraw all weth to eth in the router
    /// Send the eth to the specified recipient
    /// @param to the address to receive the eth
    /// @param amountFeiIn the amount of FEI to redeem
    /// @param minAmountOut the minimum amount of weth to receive
    function redeem(
        address to,
        uint256 amountFeiIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut);
}
