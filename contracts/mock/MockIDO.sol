pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockIDO {

	Decimal.D256 public ratio = Decimal.zero();
	IERC20 public tribe;
	IERC20 public fei;
	uint multiplier;


	constructor(address _tribe, uint _multiplier, address _fei) public {
		tribe = IERC20(_tribe);
		fei = IERC20(_fei);
		multiplier = _multiplier;
	}

	function deploy(Decimal.D256 memory feiRatio) public {
		ratio = feiRatio;
	}

	function swapFei(uint amount) public returns (uint amountOut) {
		fei.transferFrom(msg.sender, address(this), amount);

		amountOut = amount * multiplier;

		tribe.transfer(msg.sender, amountOut);
		
		return amountOut;
	}
}

