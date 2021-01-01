pragma solidity ^0.6.2;

import "./IPCVDeposit.sol";
import "../token/IUniswapIncentive.sol";

/// @title a Uniswap PCV Controller interface
/// @author Fei Protocol
interface IUniswapPCVController {
    
    // ----------- Events -----------

    event Reweight(address indexed _caller);

	event PCVDepositUpdate(address indexed _pcvDeposit);

	event ReweightIncentiveUpdate(uint _amount);

	event ReweightMinDistanceUpdate(uint _basisPoints);

    // ----------- State changing API -----------

    /// @notice reweights the linked PCV Deposit to the peg price. Needs to be reweight eligible
	function reweight() external;

    // ----------- Governor only state changing API -----------

    /// @notice reweights regardless of eligibility
    function forceReweight() external;

    /// @notice sets the target PCV Deposit address
	function setPCVDeposit(address _pcvDeposit) external;

    /// @notice sets the reweight incentive amount
	function setReweightIncentive(uint amount) external;

    /// @notice sets the reweight min distance in basis points
	function setReweightMinDistance(uint basisPoints) external;

    // ----------- Getters -----------

    /// @notice returns the linked pcv deposit contract
	function pcvDeposit() external returns(IPCVDeposit);

    /// @notice returns the linked Uniswap incentive contract
    function incentiveContract() external returns(IUniswapIncentive);

    /// @notice gets the FEI reward incentive for reweighting
    function reweightIncentiveAmount() external returns(uint);

    /// @notice signal whether the reweight is available. Must have incentive parity and minimum distance from peg
	function reweightEligible() external view returns(bool);
}
