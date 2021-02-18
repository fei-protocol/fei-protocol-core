pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../token/IIncentive.sol";
import "../refs/CoreRef.sol";

contract MockIncentive is IIncentive, CoreRef {

	constructor(address core) public
		CoreRef(core)
	{}

    uint256 constant private INCENTIVE = 100;

    function incentivize(
    	address sender, 
    	address, 
    	address, 
    	uint256
    ) public override {
        fei().mint(sender, INCENTIVE);
    }
}