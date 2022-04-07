// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

/** 
    @title Fei Risk Curve Interface
    @author Fei Protocol

    Risk Curves define a set of balancer weights for a given level of *leverage* in the PCV, which is computable from the collateralization ratio.

    The goal is to have higher weights on stable assets at high leverage (low collateralization) to derisk, and add more volatile assets at high collateralization.

    The Risk Curve will also take into account the magnitute of the change in weights to determine an amount of time to transition
 */
interface IRiskCurve {
    struct CurveParams {
        address[] assets;
        uint256[] baseWeights;
        int256[] slopes;
    }

    // ----------- public state changing API -----------
    /// @notice kick off a new weight change using the current leverage and weight change time
    function changeWeights() external;

    // ----------- Governor or admin only state changing API -----------
    /// @notice change the risk curve parameters
    function changeCurve(CurveParams memory curveParams) external;

    // ----------- Read-only API -----------
    /// @notice determine whether or not to kick off a new weight change
    function isWeightChangeEligible() external view returns (bool);

    /// @notice return the risk curve parameters
    function getCurveParams() external view returns (CurveParams memory);

    /// @notice return the current leverage in the protocol, defined as PCV / protocol equity
    function getCurrentLeverage() external view returns (uint256);

    /// @notice return the balancer weight of an asset at a given leverage
    function getAssetWeight(address asset, uint256 leverage)
        external
        view
        returns (uint256);

    /// @notice return the set of assets and their corresponding weights at a given leverage
    function getWeights(uint256 leverage)
        external
        view
        returns (address[] memory, uint256[] memory);

    /// @notice return the target weight for an asset at current leverage
    function getCurrentTargetAssetWeight(address asset)
        external
        view
        returns (uint256);

    /// @notice return the set of assets and their corresponding weights at a current leverage
    function getCurrentTargetWeights()
        external
        view
        returns (address[] memory, uint256[] memory);

    /// @notice get the number of seconds to transition weights given the old and new weights
    function getWeightChangeTime(
        uint256[] memory oldWeights,
        uint256[] memory newWeights
    ) external view returns (uint256);
}
