pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../token/IFei.sol";

interface ITribe is IERC20 {
	function delegate(address delegatee) external;
}

/// @title a timelock for TRIBE allowing for sub-delegation
/// @author Fei Protocol
/// @notice allows the timelocked TRIBE to be delegated by the beneficiary while locked
interface ITimelockedDelegator {

	// ----------- Events -----------

    event Delegate(address indexed _delegatee, uint _amount);

    event Undelegate(address indexed _delegatee, uint _amount);

    // ----------- Beneficiary only state changing api -----------

	/// @notice delegate locked TRIBE to a delegatee
	/// @param delegatee the target address to delegate to
	/// @param amount the amount of TRIBE to delegate. Will increment existing delegated TRIBE
    function delegate(address delegatee, uint amount) external;

	/// @notice return delegated TRIBE to the timelock
	/// @param delegatee the target address to undelegate from
	/// @return the amount of TRIBE returned
    function undelegate(address delegatee) external returns(uint);

    // ----------- Getters -----------

	/// @notice associated delegate proxy contract for a delegatee
	/// @param delegatee The delegatee
	/// @return the corresponding delegate proxy contract
    function delegateContract(address delegatee) external view returns(address);

	/// @notice associated delegated amount for a delegatee
	/// @param delegatee The delegatee
	/// @return uint amount of TRIBE delegated
    /// @dev Using as source of truth to prevent accounting errors by transferring to Delegate contracts
    function delegateAmount(address delegatee) external view returns(uint);

	/// @notice the total delegated amount of TRIBE
    function totalDelegated() external view returns(uint);

	/// @notice the TRIBE token contract
    function tribe() external view returns(ITribe);

}