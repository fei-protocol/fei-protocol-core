pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/SafeCast.sol";
import "../external/SafeMathCopy.sol";

/// @title an abstract contract for timed events
/// @author Fei Protocol
abstract contract Timed {
    using SafeCast for uint;

    /// @notice the start timestamp of the timed period
    uint public startTime;

    /// @notice the duration of the timed period
	uint public duration;

    constructor(uint _duration) public {
        duration = _duration;
    }

    /// @notice return true if time period has ended
    function isTimeEnded() public view returns (bool) {
        return remainingTime() == 0;
    }

    /// @notice number of seconds remaining until time is up
    /// @return remaining
    function remainingTime() public view returns (uint) {
        return SafeMathCopy.sub(duration, timeSinceStart());
    }

    /// @notice number of seconds since contract was initialized
    /// @return timestamp
    /// @dev will be less than or equal to duration
    function timeSinceStart() public view returns (uint) {
		uint _duration = duration;
		// solhint-disable-next-line not-rely-on-time
		uint timePassed = SafeMathCopy.sub(block.timestamp, startTime);
		return timePassed > _duration ? _duration : timePassed;
    }

    function _initTimed() internal {
        // solhint-disable-next-line not-rely-on-time
        startTime = block.timestamp;
    }
}