pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../token/IIncentive.sol";
import "../refs/CoreRef.sol";

contract MockIncentive is IIncentive, CoreRef {

	constructor(address core) 
		CoreRef(core)
	public {}

    uint256 constant private INCENTIVE = 100;

    function incentivize(
    	address sender, 
    	address receiver, 
    	address spender, 
    	uint256 amountIn
    ) public override {
        fei().mint(sender, INCENTIVE);
    }
}