pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";
import "../external/SafeMath32.sol";
import "../external/SafeMath128.sol";
import "../external/SafeMathCopy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";

abstract contract Pool is ERC20, ERC20Burnable {
	using Decimal for Decimal.D256;
	using SafeMath32 for uint32;
	using SafeMath128 for uint128;
	using SafeCast for uint256;

	bool internal initialized;

	IERC20 public rewardToken;
	IERC20 public stakedToken;

	uint32 public startTime;
	uint32 public duration;

	uint128 public claimedRewards;
	uint128 public stakedAmount;

    mapping (address => uint) public stakedBalances;

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

	function init() public virtual {
		require(!initialized, "Pool: Already initialized");
		// solhint-disable-next-line not-rely-on-time
		startTime = now.toUint32();
		initialized = true;
	}

	function claim(address account) external returns(uint) {
		(uint amountStaked, uint amountReward) = _withdraw(account);
		_deposit(account, amountStaked);
		emit Claim(account, amountReward);
		return amountReward;
	}

	function deposit(uint amount) public {
		_deposit(msg.sender, amount);
		emit Deposit(msg.sender, amount);
	}

	function withdraw() public returns(uint amountStaked, uint amountReward) {
		(amountStaked, amountReward) = _withdraw(msg.sender);
		emit Withdraw(msg.sender, amountStaked, amountReward);
		return (amountStaked, amountReward);
	}

    function userRedeemableReward(address account) public view returns(uint) {
		return releasedReward() * userRedeemablePoolTokens(account) / totalRedeemablePoolTokens();
    }

	function totalRedeemablePoolTokens() public view returns(uint) {
		uint total = totalSupply();
		uint balance = twfb(uint256(stakedAmount));
		require(total >= balance, "Pool: Total Redeemable underflow");
		return total - balance;
	}

	function userRedeemablePoolTokens(address account) public view returns(uint) {
		uint total = balanceOf(account);
		uint balance = twfb(stakedBalances[account]);
		require(total >= balance, "Pool: Total Redeemable underflow");
		return total - balance;
	}

	function releasedReward() public view returns (uint) {
		uint total = rewardBalance();
		uint unreleased = unreleasedReward();
		require(total >= unreleased, "Pool: Released Reward underflow");
		return total - unreleased;
	}

	function unreleasedReward() public view returns (uint) {
		uint _duration = uint256(duration);
		uint t = uint256(timestamp());
		if (t == _duration) {
			return 0;
		}
		return _unreleasedReward(totalReward(), _duration, t);
	}

	function _unreleasedReward(uint _totalReward, uint _duration, uint _time) internal view virtual returns (uint);

	function burnFrom(address account, uint256 amount) public override {
		if (msg.sender == account) {
			increaseAllowance(account, amount);
		}
		super.burnFrom(account, amount);
	}

	function _deposit(address account, uint amount) internal {
		require(initialized, "Pool: Uninitialized");
		stakedToken.transferFrom(account, address(this), amount);
		stakedBalances[account] += amount;
		incrementStaked(amount);
		uint poolTokens = twfb(amount);
		require(poolTokens != 0, "Pool: Window has ended");
		_mint(account, poolTokens);
	}

	function _withdraw(address account) internal returns(uint amountStaked, uint amountReward) {
		uint amountPoolTokens = balanceOf(account);
		require(amountPoolTokens != 0, "Pool: User has no pool tokens");
		amountStaked = stakedBalances[account];
		amountReward = userRedeemableReward(account);
		incrementClaimed(amountReward);
		burnFrom(account, amountPoolTokens);
		stakedBalances[account] = 0;
		stakedToken.transfer(account, amountStaked);
		rewardToken.transfer(account, amountReward);
		return (amountStaked, amountReward);	
	}

	function incrementClaimed(uint256 amount) internal {
		claimedRewards = claimedRewards.add(amount.toUint128());
	}

	function incrementStaked(uint256 amount) internal {
		stakedAmount = stakedAmount.add(amount.toUint128());
	}

	function twfb(uint amount) internal view returns(uint) {
		return amount * uint256(remainingTime());
	}

	function remainingTime() internal view returns(uint32) {
		return duration.sub(timestamp());
	}

	function timestamp() internal view returns(uint32) {
		uint32 d = duration;
		// solhint-disable-next-line not-rely-on-time
		uint32 t = now.toUint32().sub(startTime);
		return t > d ? d : t;
	}

	// Updates stored staked balance pro-rata for transfer and transferFrom
	function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0)) {
 			Decimal.D256 memory ratio = Decimal.ratio(amount, balanceOf(from));
 			uint amountStaked = ratio.mul(stakedBalances[from]).asUint256();
 			stakedBalances[from] -= amountStaked;
 			stakedBalances[to] += amountStaked;
        }
    }

	function setTokens(address _rewardToken, address _stakedToken) internal {
		rewardToken = IERC20(_rewardToken);
		stakedToken = IERC20(_stakedToken);	
	}

	function totalReward() internal view returns (uint) {
		return rewardBalance() + uint256(claimedRewards);
	}

	function rewardBalance() internal view returns (uint) {
		return rewardToken.balanceOf(address(this));
	}
}