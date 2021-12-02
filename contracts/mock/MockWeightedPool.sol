// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockERC20.sol";
import "./MockVault.sol";
import "../pcv/balancer/IVault.sol";

contract MockWeightedPool is MockERC20 {

    uint256 public _startTime;
    uint256 public _endTime;
    uint256[] public _endWeights;

    MockVault public immutable getVault;
    bytes32 public constant getPoolId = bytes32(uint256(1));
    address public immutable getOwner;

    bool public getSwapEnabled;
    bool public getPaused;
    uint256 public getSwapFeePercentage;
    uint256[] public weights; // normalized weights
    uint256 rate = 1e18; // rate of the LP tokens vs underlying (for stable pools)

    constructor(MockVault vault, address owner) {
        getOwner = owner;
        getVault = vault;
        mint(address(this), 1); // prevents totalSupply() to be 0
        weights = new uint256[](2);
        weights[0] = 5e17;
        weights[1] = 5e17;
    }

    function mockInitApprovals() external {
        for (uint256 i = 0; i < weights.length; i++) {
            getVault._tokens(i).approve(address(getVault), type(uint256).max);
        }
    }

    function mockSetNormalizedWeights(uint256[] memory _weights) external {
        weights = _weights;
    }

    // this method is specific to weighted pool
    function getNormalizedWeights()
        external
        view
        returns (
            uint256[] memory _weights
        ) {
            return weights;
        }

    // this method is specific to stable pool, but for convenience we just need
    // one mock balancer pool
    function getRate() external view returns (uint256) {
        return rate;
    }
    function mockSetRate(uint256 _rate) external {
        rate = _rate;
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
