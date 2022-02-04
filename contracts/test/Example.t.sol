pragma solidity ^0.8.4;

import "./utils/DSTest.sol";

contract ExampleTest is DSTest {
    function setUp() public {}

    function testAdd() public {
        assertEq(uint256(5) + uint256(3), uint256(8));
    }
}
