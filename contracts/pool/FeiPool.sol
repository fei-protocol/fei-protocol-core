pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Pool.sol";
import "../refs/CoreRef.sol";

/// @title A Pool for earning TRIBE with staked FEI/TRIBE LP tokens
/// @author Fei Protocol
/// @notice deposited LP tokens will earn TRIBE over time at a linearly decreasing rate
contract FeiPool is Pool, CoreRef {
	
	/// @notice Fei Pool constructor
	/// @param _core Fei Core to reference
	/// @param _pair Uniswap pair to stake
	/// @param _duration duration of staking rewards
	constructor(address _core, address _pair, uint32 _duration) public 
		CoreRef(_core) Pool(_duration, "Fei USD Pool", "FPOOL") 
	{
		_setTokens(
			address(tribe()),
			_pair
		);
	}

	/// @notice sends tokens back to governance treasury. Only callable by governance
	/// @param amount the amount of tokens to send back to treasury
	function governorWithdraw(uint amount) external onlyGovernor {
		tribe().transfer(address(core()), amount);
	}

	function init() public override postGenesis {
		super.init();	
	}

	// Represents the integral of 2R/d - 2R/d^2 x dx from t to d
	// Integral equals 2Rx/d - Rx^2/d^2
	// Evaluated at t = 2R*t/d (start) - R*t^2/d^2 (end)
	// Evaluated at d = 2R - R = R
	// Solution = R - (start - end) or equivalently end + R - start (latter more convenient to code)
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