pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IPool.sol";
import "../external/Decimal.sol";
import "../external/SafeMath32.sol";
import "../external/SafeMath128.sol";
import "../external/SafeMathCopy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";

/// @title abstract implementation of IPool interface
/// @author Fei Protocol
abstract contract Pool is IPool, ERC20, ERC20Burnable {
	using Decimal for Decimal.D256;
	using SafeMath32 for uint32;
	using SafeMath128 for uint128;
	using SafeCast for uint256;

	bool internal initialized;

	IERC20 public override rewardToken;
	IERC20 public override stakedToken;

	uint32 public override startTime;
	uint32 public override duration;

	uint128 public override claimedRewards;
	uint128 public override totalStaked;

    mapping (address => uint) public override stakedBalance;

    event Claim(address indexed _account, uint _amountReward);
    event Deposit(address indexed _account, uint _amountStaked);
    event Withdraw(address indexed _account, uint _amountStaked, uint _amountReward);

	constructor(
		uint32 _duration,
		string memory _name,
		string memory _ticker
	) public 
		ERC20(_name, _ticker)
	{
		duration = _duration;
	}

	function claim(address account) external override returns(uint) {
		(uint amountStaked, uint amountReward) = _withdraw(account);
		_deposit(account, amountStaked);
		emit Claim(account, amountReward);
		return amountReward;
	}

	function deposit(uint amount) external override {
		_deposit(msg.sender, amount);
		emit Deposit(msg.sender, amount);
	}

	function withdraw() external override returns(uint amountStaked, uint amountReward) {
		(amountStaked, amountReward) = _withdraw(msg.sender);
		emit Withdraw(msg.sender, amountStaked, amountReward);
		return (amountStaked, amountReward);
	}

	function init() public override virtual {
		require(!initialized, "Pool: Already initialized");
		// solhint-disable-next-line not-rely-on-time
		startTime = now.toUint32();
		initialized = true;
	}

    function redeemableReward(address account) public view override returns(uint) {
		return releasedReward() * _redeemablePoolTokens(account) / _totalRedeemablePoolTokens();
    }

	function releasedReward() public view override returns (uint) {
		uint total = rewardBalance();
		uint unreleased = unreleasedReward();
		require(total >= unreleased, "Pool: Released Reward underflow");
		return total - unreleased;
	}

	function unreleasedReward() public view override returns (uint) {
		uint _duration = uint256(duration);
		uint t = uint256(timestamp());
		if (t == _duration) {
			return 0;
		}
		return _unreleasedReward(totalReward(), _duration, t);
	}

	function totalReward() public view override returns (uint) {
		return rewardBalance() + uint256(claimedRewards);
	}

	function rewardBalance() public view override returns (uint) {
		return rewardToken.balanceOf(address(this));
	}

	function remainingTime() public view override returns(uint32) {
		return duration.sub(timestamp());
	}

	function timestamp() public view override returns(uint32) {
		uint32 d = duration;
		// solhint-disable-next-line not-rely-on-time
		uint32 t = now.toUint32().sub(startTime);
		return t > d ? d : t;
	}

	function burnFrom(address account, uint256 amount) public override {
		if (msg.sender == account) {
			increaseAllowance(account, amount);
		}
		super.burnFrom(account, amount);
	}

	function _totalRedeemablePoolTokens() public view returns(uint) {
		uint total = totalSupply();
		uint balance = _twfb(uint256(totalStaked));
		require(total >= balance, "Pool: Total redeemable underflow");
		return total - balance;
	}

	function _redeemablePoolTokens(address account) public view returns(uint) {
		uint total = balanceOf(account);
		uint balance = _twfb(stakedBalance[account]);
		require(total >= balance, "Pool: Redeemable underflow");
		return total - balance;
	}

	function _unreleasedReward(uint _totalReward, uint _duration, uint _time) internal view virtual returns (uint);

	function _deposit(address account, uint amount) internal {
		require(initialized, "Pool: Uninitialized");
		stakedToken.transferFrom(account, address(this), amount);
		stakedBalance[account] += amount;
		_incrementStaked(amount);
		uint poolTokens = _twfb(amount);
		require(poolTokens != 0, "Pool: Window has ended");
		_mint(account, poolTokens);
	}

	function _withdraw(address account) internal returns(uint amountStaked, uint amountReward) {
		uint amountPoolTokens = balanceOf(account);
		require(amountPoolTokens != 0, "Pool: User has no pool tokens");
		amountStaked = stakedBalance[account];
		amountReward = redeemableReward(account);
		_incrementClaimed(amountReward);
		burnFrom(account, amountPoolTokens);
		stakedBalance[account] = 0;
		stakedToken.transfer(account, amountStaked);
		rewardToken.transfer(account, amountReward);
		return (amountStaked, amountReward);	
	}

	function _incrementClaimed(uint256 amount) internal {
		claimedRewards = claimedRewards.add(amount.toUint128());
	}

	function _incrementStaked(uint256 amount) internal {
		totalStaked = totalStaked.add(amount.toUint128());
	}

	function _twfb(uint amount) internal view returns(uint) {
		return amount * uint256(remainingTime());
	}

	// Updates stored staked balance pro-rata for transfer and transferFrom
	function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
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