pragma solidity ^0.6.0;

import "./MockERC20.sol";

contract MockTribe is MockERC20 {
    function delegate(address account) external {}
}
