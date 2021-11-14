pragma solidity ^0.8.4;

contract MockBAMM {
    event Swap(uint256 lusdAmount, uint256 minEthReturn, address to);

	function swap(uint256 lusdAmount, uint256 minEthReturn, address to) public returns(uint256) {
        emit Swap(lusdAmount, minEthReturn, to);
        return 0;
    }
}