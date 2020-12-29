pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../refs/CoreRef.sol";
import "./Pool.sol";

contract FeiPool is Pool, CoreRef {
	constructor(address core, uint32 _duration) public 
		CoreRef(core) 
		Pool(
			_duration,
			"Fei USD Pool", 
			"FPOOL"
		) {
			setTokens(
				address(tribe()),
				address(fei())
			);
		}

	function init() public override postGenesis {
		super.init();	
	}

	function _unreleasedReward(
		uint _totalReward, 
		uint _duration, 
		uint _time
	) internal view override returns (uint) {
		// 2T*t/d 
		Decimal.D256 memory start = Decimal.ratio(_totalReward, _duration).mul(2).mul(_time);
		// T*t^2/d^2
		Decimal.D256 memory end = Decimal.ratio(_totalReward, _duration).div(_duration).mul(_time * _time);
		return end.add(_totalReward).sub(start).asUint256();
	}

	function governorWithdraw(uint amount) public onlyGovernor {
		tribe().transfer(address(core()), amount);
	}
}