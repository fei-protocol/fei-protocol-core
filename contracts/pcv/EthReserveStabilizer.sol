pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./ReserveStabilizer.sol";

/// @title implementation for an ETH Reserve Stabilizer
/// @author Fei Protocol
contract EthReserveStabilizer is ReserveStabilizer {

    constructor(
        address _core,
        address _oracle,
        uint _usdPerFeiBasisPoints
    ) public ReserveStabilizer(_core, _oracle, IERC20(address(0)), _usdPerFeiBasisPoints) {}

    receive() external payable {}

    /// @notice returns the amount of the held ETH
    function totalValue() public view override returns(uint256) {
        return address(this).balance;
    }

    function _transfer(address to, uint256 amount) internal override {
        Address.sendValue(payable(to), amount);
    }
}
