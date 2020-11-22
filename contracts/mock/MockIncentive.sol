pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../token/IIncentive.sol";
import "../core/CoreRef.sol";

contract MockIncentive is IIncentive, CoreRef {

	constructor(address core) 
		CoreRef(core)
	public {}

    bool onSender;
    bool onReceiver;
    uint256 constant private INCENTIVE = 100;
    bool isMint;

    function incentivize(
    	address sender, 
    	address receiver, 
    	address spender, 
    	uint256 amountIn
    ) public override {
        if (onSender) {
            if (isMint) {
                fii().mint(sender, INCENTIVE);
            } else {
                fii().burnFrom(sender, INCENTIVE);
            }
        }
        if (onReceiver) {
            if (isMint) {
                fii().mint(receiver, INCENTIVE);
            } else {
                fii().burnFrom(receiver, INCENTIVE);
            }
        }
    }

    function setTargets(bool _onSender, bool _onReceiver, bool _isMint) public {
        onSender = _onSender;
        onReceiver = _onReceiver;
        isMint = _isMint;
    }
}