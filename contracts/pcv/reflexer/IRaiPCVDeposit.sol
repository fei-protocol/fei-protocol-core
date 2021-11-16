// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.4;

import "../../oracle/IOracle.sol";

interface IRaiPCVDeposit {
    struct SwapParams {
        IOracle oracle;
        uint24 poolFee;
        uint256 minimumAmountIn;
    }

    // ----------- Events -----------
    event MaxBasisPointsFromPegLPUpdate(uint256 oldMaxBasisPointsFromPegLP, uint256 newMaxBasisPointsFromPegLP);
    event MaxSlippageUpdate(uint256 oldMaxSlippage, uint256 newMaximumSlippageBasisPoints);
    event PositionTicksUpdate(int24 oldTickLower, int24 oldTickUpper, int24 newTickLower, int24 newTickUpper);
    event MaximumAvailableETHUpdate(uint256 oldMaximumAvailableETH, uint256 newMaximumAvailableETH);
    event TargetCollateralRatioUpdate(uint256 oldCRatio, uint256 newCRatio);
    event SwapTokenApprovalUpdate(address token);

    // ----------- Governor only state changing api -----------

    function setMaxAvailableETH(uint256 amount) external;

    function setMaxBasisPointsFromPegLP(uint256 bps) external;

    function setMaxSlipageBasisPoints(uint256 bps) external;

    function setTargetCollateralRatio(uint256 ratio) external;

    function setSwapTokenApproval(address[] memory tokens, SwapParams[] memory newSwapParamsData) external;

    // ----------- Getters -----------

    function maxBasisPointsFromPegLP() external view returns (uint256);

    function maxSlippageBasisPoints() external view returns (uint256);
}
