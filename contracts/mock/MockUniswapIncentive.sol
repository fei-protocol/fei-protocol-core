pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./MockIncentive.sol";

contract MockUniswapIncentive is MockIncentive {

	constructor(address core) 
		MockIncentive(core)
	public {}

    bool isParity = false;

    function isIncentiveParity() external view returns (bool) {
        return isParity;
    }

    function setIncentiveParity(bool _isParity) public {
        isParity = _isParity;
    }

    function setExemptAddress(address account, bool isExempt) external {}
}