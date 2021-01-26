pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/SafeCast.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IPool.sol";
import "../utils/Timed.sol";
import "../utils/SafeMath128.sol";
import "../external/SafeMathCopy.sol";
import "../external/Decimal.sol";

/// @title abstract implementation of IPool interface
/// @author Fei Protocol
abstract contract Pool is IPool, ERC20, ERC20Burnable, Timed {
	using Decimal for Decimal.D256;
	using SafeMath128 for uint128;
	using SafeCast for uint;

	bool internal initialized;

	IERC20 public override rewardToken;
	IERC20 public override stakedToken;

	uint128 public override claimedRewards;
	uint128 public override totalStaked;

    mapping (address => uint) public override stakedBalance;

	/// @notice Pool constructor
	/// @param _duration duration of the pool reward distribution
	/// @param _name the name of the pool token
	/// @param _ticker the token ticker for the pool token
	constructor(
		uint32 _duration,
		string memory _name,
		string memory _ticker
	) public ERC20(_name, _ticker) Timed(_duration) {}

	function claim(address from, address to) external override returns(uint amountReward) {
		amountReward = _claim(from, to);
		emit Claim(from, to, amountReward);
		return amountReward;
	}

	function deposit(address to, uint amount) external override {
		address from = msg.sender;
		_deposit(from, to, amount);
		emit Deposit(from, to, amount);
	}

	function withdraw(address to) external override returns(uint amountStaked, uint amountReward) {
		address from = msg.sender;
		amountReward = _claim(from, to);
		amountStaked = _withdraw(from, to);
		emit Withdraw(from, to, amountStaked, amountReward);
		return (amountStaked, amountReward);
	}

	function init() public override virtual {
		require(!initialized, "Pool: Already initialized");
		_initTimed();
		initialized = true;
	}

    function redeemableReward(address account) public view override returns(uint amountReward, uint amountPool) {
		amountPool = _redeemablePoolTokens(account);
		uint totalRedeemablePool = _totalRedeemablePoolTokens();
		if (totalRedeemablePool == 0) {
			return (0, 0);
		}
		return (releasedReward() * amountPool / totalRedeemablePool, amountPool);
    }

	function releasedReward() public view override returns (uint) {
		uint total = rewardBalance();
		uint unreleased = unreleasedReward();
		return total.sub(unreleased, "Pool: Released Reward underflow");
	}

	function unreleasedReward() public view override returns (uint) {
		if (isTimeEnded()) {
			return 0;
		}
		return _unreleasedReward(totalReward(), uint(duration), uint(timestamp()));
	}

	function totalReward() public view override returns (uint) {
		return rewardBalance() + uint(claimedRewards);
	}

	function rewardBalance() public view override returns (uint) {
		return rewardToken.balanceOf(address(this));
	}

	function burnFrom(address account, uint amount) public override {
		if (msg.sender == account) {
			increaseAllowance(account, amount);
		}
		super.burnFrom(account, amount);
	}

	function _totalRedeemablePoolTokens() internal view returns(uint) {
		uint total = totalSupply();
		uint balance = _twfb(uint(totalStaked));
		return total.sub(balance, "Pool: Total redeemable underflow");
	}

	function _redeemablePoolTokens(address account) internal view returns(uint) {
		uint total = balanceOf(account);
		uint balance = _twfb(stakedBalance[account]);
		return total.sub(balance, "Pool: Redeemable underflow");
	}

	function _unreleasedReward(uint _totalReward, uint _duration, uint _time) internal view virtual returns (uint);

	function _deposit(address from, address to, uint amount) internal {
		require(initialized, "Pool: Uninitialized");
		require(amount <= stakedToken.balanceOf(from), "Pool: Balance too low to stake");

		stakedToken.transferFrom(from, address(this), amount);

		stakedBalance[to] += amount;
		_incrementStaked(amount);
		
		uint poolTokens = _twfb(amount);
		require(poolTokens != 0, "Pool: Window has ended");

		_mint(to, poolTokens);
	}

	function _withdraw(address from, address to) internal returns(uint amountStaked) {
		amountStaked = stakedBalance[from];
		stakedBalance[from] = 0;
		stakedToken.transfer(to, amountStaked);

		uint amountPool = balanceOf(from);
		if (amountPool != 0) {
			_burn(from, amountPool);
		}
		return amountStaked;	
	}

	function _claim(address from, address to) internal returns(uint) {
		(uint amountReward, uint amountPool) = redeemableReward(from);
		require(amountPool != 0, "Pool: User has no redeemable pool tokens");

		burnFrom(from, amountPool);
		_incrementClaimed(amountReward);

		rewardToken.transfer(to, amountReward);
		return amountReward;
	}

	function _incrementClaimed(uint amount) internal {
		claimedRewards = claimedRewards.add(amount.toUint128());
	}

	function _incrementStaked(uint amount) internal {
		totalStaked = totalStaked.add(amount.toUint128());
	}

	function _twfb(uint amount) internal view returns(uint) {
		return amount * uint(remainingTime());
	}

	// Updates stored staked balance pro-rata for transfer and transferFrom
	function _beforeTokenTransfer(address from, address to, uint amount) internal override {
        if (from != address(0) && to != address(0)) {
 			Decimal.D256 memory ratio = Decimal.ratio(amount, balanceOf(from));
 			uint amountStaked = ratio.mul(stakedBalance[from]).asUint256();
			
 			stakedBalance[from] -= amountStaked;
 			stakedBalance[to] += amountStaked;
        }
    }

	function _setTokens(address _rewardToken, address _stakedToken) internal {
		rewardToken = IERC20(_rewardToken);
		stakedToken = IERC20(_stakedToken);	
	}
}