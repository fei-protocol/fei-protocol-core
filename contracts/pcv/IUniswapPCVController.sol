pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import "./IPCVDeposit.sol";
import "../token/IUniswapIncentive.sol";

/// @title a Uniswap PCV Controller interface
/// @author Fei Protocol
interface IUniswapPCVController {
    // ----------- Events -----------

    event Reweight(address indexed _caller);

    event PCVDepositUpdate(address indexed _pcvDeposit);

    event ReweightIncentiveUpdate(uint256 _amount);

    event ReweightMinDistanceUpdate(uint256 _basisPoints);

    // ----------- State changing API -----------

    function reweight() external;

    // ----------- Governor only state changing API -----------

    function forceReweight() external;

    function setPCVDeposit(address _pcvDeposit) external;

    function setReweightIncentive(uint256 amount) external;

    function setReweightMinDistance(uint256 basisPoints) external;

    // ----------- Getters -----------

    function pcvDeposit() external returns (IPCVDeposit);

    function incentiveContract() external returns (IUniswapIncentive);

    function reweightIncentiveAmount() external returns (uint256);

    function reweightEligible() external view returns (bool);

    function minDistanceForReweight()
        external
        view
        returns (Decimal.D256 memory);
}
