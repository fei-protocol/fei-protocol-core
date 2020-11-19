pragma solidity ^0.6.0;

import "../token/IIncentive.sol";

contract PrototypeIncentive is IIncentive {

	uint16 percentage = 10_000;
    uint16 GRANULARITY = 10_000;
    bool isMint = true;

	constructor(uint16 _percentage, bool _isMint) public {
		percentage = _percentage;
        isMint = _isMint;
	}

    function getIncentiveAmount(bool isSender, address account, uint256 amountIn) override external view returns (uint256, bool) {
        return (amountIn * percentage / GRANULARITY, isMint);
    }
}