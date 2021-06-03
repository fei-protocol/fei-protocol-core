// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IPCVDeposit.sol";
import "../external/Decimal.sol";

/// @title a Uniswap PCV Controller interface
/// @author Fei Protocol
interface IUniswapPCVController {
    // ----------- Events -----------

    event Reweight(address indexed _caller);

    event PCVDepositUpdate(
        address indexed _oldPCVDeposit,
        address indexed _newPCVDeposit
    );

    event ReweightIncentiveUpdate(uint256 _oldIncentive, uint256 _newIncentive);

    event ReweightMinDistanceUpdate(
        uint256 _oldMinDistanceBasisPoints,
        uint256 _newMinDistanceBasisPoints
    );

    // ----------- State changing API -----------

    function reweight() external;

    // ----------- Governor only state changing API -----------

    function forceReweight() external;

    function setPCVDeposit(address _pcvDeposit) external;

    function setDuration(uint256 _duration) external;

    function setReweightIncentive(uint256 amount) external;

    function setReweightMinDistance(uint256 basisPoints) external;

    // ----------- Getters -----------

    function pcvDeposit() external view returns (IPCVDeposit);

    function reweightIncentiveAmount() external view returns (uint256);

    function reweightEligible() external view returns (bool);

    function getDistanceToPeg() external view returns (Decimal.D256 memory);

    function minDistanceForReweight()
        external
        view
        returns (Decimal.D256 memory);
}
