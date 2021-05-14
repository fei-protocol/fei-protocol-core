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

    event ReweightWithdrawBPsUpdate(uint256 _reweightWithdrawBPs);

    // ----------- State changing API -----------

    function reweight() external;

    // ----------- Governor only state changing API -----------

    function forceReweight() external;

    function setPCVDeposit(address _pcvDeposit) external;

    function setDuration(uint256 _duration) external;

    function setReweightIncentive(uint256 amount) external;

    function setReweightMinDistance(uint256 basisPoints) external;

    function setReweightWithdrawBPs(uint256 _reweightWithdrawBPs) external;
    
    // ----------- Getters -----------

    function pcvDeposit() external view returns (IPCVDeposit);

    function incentiveContract() external view returns (IUniswapIncentive);

    function reweightIncentiveAmount() external view returns (uint256);

    function reweightEligible() external view returns (bool);

    function reweightWithdrawBPs() external view returns (uint256);

    function minDistanceForReweight()
        external
        view
        returns (Decimal.D256 memory);
}
