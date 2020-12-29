pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../refs/CoreRef.sol";
import "./Pool.sol";

/// @title A Pool for earning TRIBE with staked FEI
/// @author Fei Protocol
/// @notice deposited FEI will earn TRIBE over time at a linearly decreasing rate
contract FeiPool is Pool, CoreRef {
	/// @notice constructs a Pool contract pointing to `core` with duration `_duration`
	constructor(address core, uint32 _duration) public 
		CoreRef(core) 
		Pool(
			_duration,
			"Fei USD Pool", 
			"FPOOL"
		) {
			_setTokens(
				address(tribe()),
				address(fei())
			);
		}

	function init() public override postGenesis {
		super.init();	
	}

	/// @notice sends tokens back to governance treasury. Only callable by governance
	/// @param amount the amount of tokens to send back to treasury
	function governorWithdraw(uint amount) public onlyGovernor {
		tribe().transfer(address(core()), amount);
	}

	function _unreleasedReward(
		uint _totalReward, 
		uint _duration, 
		uint _time
	) internal view override returns (uint) {
		// 2R*t/d 
		Decimal.D256 memory start = Decimal.ratio(_totalReward, _duration).mul(2).mul(_time);
		// R*t^2/d^2
		Decimal.D256 memory end = Decimal.ratio(_totalReward, _duration).div(_duration).mul(_time * _time);
		return end.add(_totalReward).sub(start).asUint256();
	}
}