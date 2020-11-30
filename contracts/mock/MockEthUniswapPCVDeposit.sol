pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./MockEthPCVDeposit.sol";

contract MockEthUniswapPCVDeposit is MockEthPCVDeposit {

    address public pair;

	constructor(address _pair) 
        MockEthPCVDeposit(payable(this))
    public {
        pair = _pair;
    }

    fallback() external payable {

    }
}