pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/SafeCast.sol";
import "../external/SafeMathCopy.sol";

/// @title an abstract contract for timed events
/// @author Fei Protocol
abstract contract Timed {
    using SafeCast for uint256;

    /// @notice the start timestamp of the timed period
    uint256 public startTime;

    /// @notice the duration of the timed period
    uint256 public duration;

    constructor(uint256 _duration) public {
        _setDuration(_duration);
    }

    /// @notice return true if time period has ended
    function isTimeEnded() public view returns (bool) {
        return remainingTime() == 0;
    }

    /// @notice number of seconds remaining until time is up
    /// @return remaining
    function remainingTime() public view returns (uint256) {
        return SafeMathCopy.sub(duration, timeSinceStart());
    }

    /// @notice number of seconds since contract was initialized
    /// @return timestamp
    /// @dev will be less than or equal to duration
    function timeSinceStart() public view returns (uint256) {
        if (startTime == 0) {
            return 0; // uninitialized
        }
        uint256 _duration = duration;
        // solhint-disable-next-line not-rely-on-time
        uint256 timePassed = SafeMathCopy.sub(block.timestamp, startTime);
        return timePassed > _duration ? _duration : timePassed;
    }

    function _initTimed() internal {
        // solhint-disable-next-line not-rely-on-time
        startTime = block.timestamp;
    }

    function _setDuration(uint _duration) internal {
        duration = _duration;
    }
}
