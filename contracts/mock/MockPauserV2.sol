pragma solidity ^0.8.4;

import "./../utils/PauserV2.sol";

contract MockPauserV2 is PauserV2 {
    constructor() PauserV2() {}

    function pause() external {
        _secondaryPause();
    }

    function unpause() external {
        _secondaryUnpause();
    }

    function failsWhenPaused() external whenNotSecondaryPaused {}

    function failsWhenNotPaused() external whenSecondaryPaused {}
}
