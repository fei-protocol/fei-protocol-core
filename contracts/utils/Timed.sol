pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./SafeMath32.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";

/// @title an abstract contract for timed events
/// @author Fei Protocol
abstract contract Timed {
    using SafeCast for uint;
	using SafeMath32 for uint32;

    /// @notice the start timestamp of the timed period
    uint32 public startTime;

    /// @notice the duration of the timed period
	uint32 public duration;

    constructor(uint32 _duration) public {
        duration = _duration;
    }

    /// @notice return true if time period has ended
    function isTimeEnded() public view returns (bool) {
        return remainingTime() == 0;
    }

    /// @notice number of seconds remaining until time is up
    /// @return remaining
    function remainingTime() public view returns (uint32) {
        return duration.sub(timestamp());
    }

    /// @notice number of seconds since contract was initialized
    /// @return timestamp
    /// @dev will be less than or equal to duration
    function timestamp() public view returns (uint32) {
		uint32 d = duration;
		// solhint-disable-next-line not-rely-on-time
		uint32 t = now.toUint32().sub(startTime);
		return t > d ? d : t;
    }

    function _initTimed() internal {
        // solhint-disable-next-line not-rely-on-time
        startTime = now.toUint32();
    }
}