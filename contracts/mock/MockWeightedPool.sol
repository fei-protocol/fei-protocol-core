// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockERC20.sol";
import "../pcv/balancer/IVault.sol";

contract MockWeightedPool is MockERC20 {

    uint256 public _startTime;
    uint256 public _endTime;
    uint256[] public _endWeights;

    IVault public immutable getVault;
    bytes32 public constant getPoolId = bytes32(uint256(1));
    address public immutable getOwner;
    
    bool public getSwapEnabled;
    bool public getPaused;
    uint256 public getSwapFeePercentage;

    constructor(IVault vault, address owner) {
        getOwner = owner;
        getVault = vault;
    }

    function getGradualWeightUpdateParams()
        external
        view
        returns (
            uint256 startTime,
            uint256 endTime,
            uint256[] memory endWeights
        ) {
            return (_startTime, _endTime, _endWeights);
        }

    function setSwapEnabled(bool swapEnabled) external {
        getSwapEnabled = swapEnabled;
    }

    function updateWeightsGradually(
        uint256 startTime,
        uint256 endTime,
        uint256[] memory endWeights
    ) external {
        _startTime = startTime;
        _endTime = endTime;
        _endWeights = endWeights;
    }

    function setSwapFeePercentage(uint256 swapFeePercentage) external {
        getSwapFeePercentage = swapFeePercentage;
    }

    function setPaused(bool paused) external {
        getPaused = paused;
    }
}
