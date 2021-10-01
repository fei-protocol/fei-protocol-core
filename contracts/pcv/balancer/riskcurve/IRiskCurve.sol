// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface IRiskCurve {
    struct CurveParams {
        address[] assets;
        uint256[] baseWeights;
        uint256[] slopes;
    }

    // ----------- public state changing API -----------
    function changeWeights() external;

    // ----------- Governor or admin only state changing API -----------
    function changeCurve(CurveParams memory curveParams) external;

    // ----------- Read-only API -----------
    function isWeightChangeEligible() external view returns(bool);

    function getCurrentLeverage() external view returns(uint256);

    function getAssetWeight(address asset, uint256 leverage) external view returns(uint256);
    
    function getWeights(uint256 leverage) external view returns(uint256[] memory);

    function getWeightChangeTime(uint256[] memory oldWeights, uint256[] memory newWeights) external view returns(uint256);
}   
