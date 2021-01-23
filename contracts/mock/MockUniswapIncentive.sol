pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./MockIncentive.sol";
import "../external/Decimal.sol";

contract MockUniswapIncentive is MockIncentive {

	constructor(address core) 
		MockIncentive(core)
	public {}

    bool isParity = false;
    bool isExempt = false;

    function isIncentiveParity() external view returns (bool) {
        return isParity;
    }

    function setIncentiveParity(bool _isParity) public {
        isParity = _isParity;
    }

    function isExemptAddress(address account) public returns (bool) {
        return isExempt;
    }

    function setExempt(bool exempt) public {
        isExempt = exempt;
    }

    function updateOracle() external returns(bool) {
        return true;
    }

    function setExemptAddress(address account, bool isExempt) external {}

    function getBuyIncentive(uint amount) external returns(uint,        
        uint32 weight,
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation
    ) {
        return (amount * 10 / 100, weight, initialDeviation, finalDeviation);
    }

    function getSellPenalty(uint amount) external returns(uint,    
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation) 
    {
        return (amount * 10 / 100, initialDeviation, finalDeviation);
    }
}