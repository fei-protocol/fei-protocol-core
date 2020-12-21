pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./refs/CoreRef.sol";
import "./external/Decimal.sol";
import "./external/SafeMath32.sol";
import "./external/SafeMath128.sol";
import "./external/SafeMathCopy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/SafeCast.sol";

contract Pool is CoreRef, ERC20 {
	using Decimal for Decimal.D256;
	using SafeMath32 for uint32;
	using SafeMath128 for uint128;
	using SafeCast for uint256;

	bool public initialized;

	uint32 public startTime;
	uint32 public duration;

	uint128 public claimed;
	uint128 public depositedFei;

    mapping (address => uint) public feiBalances;

    event Claim(address indexed _account, uint _amountTribe);
    event Deposit(address indexed _account, uint _amountFei);
    event Withdraw(address indexed _account, uint _amountFei, uint _amountTribe);

	constructor(address core, uint32 _duration) public 
		CoreRef(core) 
		ERC20("Fei USD Pool", "poolFEI")
	{
		duration = _duration;
	}

	function init() external postGenesis {
		require(!initialized, "Pool: Already initialized");
		startTime = now.toUint32();
		initialized = true;
	}

	function claim(address account) external returns(uint) {
		(uint amountFei, uint amountTribe) = _withdraw(account);
		_deposit(account, amountFei);
		emit Claim(account, amountTribe);
		return amountTribe;
	}

	function deposit(uint amount) public {
		_deposit(msg.sender, amount);
		emit Deposit(msg.sender, amount);
	}

	function withdraw() public returns(uint amountFei, uint amountTribe) {
		(amountFei, amountTribe) = _withdraw(msg.sender);
		emit Withdraw(msg.sender, amountFei, amountTribe);
		return (amountFei, amountTribe);
	}

    function userRedeemableTribe(address account) public view returns(uint) {
		return releasedTribe() * userRedeemablePoolFEI(account) / totalRedeemablePoolFEI();
    }

	function totalRedeemablePoolFEI() public view returns(uint) {
		uint total = totalSupply();
		uint balance = twfb(uint256(depositedFei));
		require(total >= balance, "Pool: Total Redeemable underflow");
		return total - balance;
	}

	function userRedeemablePoolFEI(address account) public view returns(uint) {
		uint total = balanceOf(account);
		uint balance = twfb(feiBalances[account]);
		require(total >= balance, "Pool: Total Redeemable underflow");
		return total - balance;
	}

	function releasedTribe() public view returns (uint) {
		uint total = tribeBalance();
		uint unreleased = unreleasedTribe();
		require(total >= unreleased, "Pool: Released Tribe underflow");
		return total - unreleased;
	}

	function unreleasedTribe() public view returns (uint) {
		uint tribeAmount = totalTribe();
		uint _duration = uint256(duration);
		uint t = uint256(timestamp());
		if (t == _duration) {
			return 0;
		}
		// 2T*t/d 
		Decimal.D256 memory start = Decimal.ratio(tribeAmount, _duration).mul(2).mul(t);
		// T*t^2/d^2
		Decimal.D256 memory end = Decimal.ratio(tribeAmount, _duration).div(_duration).mul(t * t);
		return end.add(tribeAmount).sub(start).asUint256();
	}

	function _deposit(address account, uint amount) internal {
		require(initialized, "Pool: Uninitialized");
		fei().transferFrom(account, address(this), amount);
		feiBalances[account] += amount;
		incrementDeposited(amount);
		uint poolFei = twfb(amount);
		require(poolFei != 0, "Pool: Window has ended");
		_mint(account, poolFei);
	}

	function _withdraw(address account) internal returns(uint amountFei, uint amountTribe) {
		uint amountPoolFei = balanceOf(account);
		require(amountPoolFei != 0, "Pool: User has no poolFei");
		amountFei = feiBalances[account];
		amountTribe = userRedeemableTribe(account);
		incrementClaimed(amountTribe);
		_burn(account, amountPoolFei);
		feiBalances[account] = 0;
		fei().transfer(account, amountFei);
		tribe().transfer(account, amountTribe);
		return (amountFei, amountTribe);	
	}

	function incrementClaimed(uint256 amount) internal {
		claimed = claimed.add(amount.toUint128());
	}

	function incrementDeposited(uint256 amount) internal {
		depositedFei = depositedFei.add(amount.toUint128());
	}

	function twfb(uint amount) internal view returns(uint) {
		return amount * uint256(remainingTime());
	}

	function remainingTime() internal view returns(uint32) {
		return duration.sub(timestamp());
	}

	function timestamp() internal view returns(uint32) {
		uint32 d = duration;
		uint32 t = now.toUint32().sub(startTime);
		return t > d ? d : t;
	}

	// Updates stored FEI balance pro-rata for transfer and transferFrom
	function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0)) {
 			Decimal.D256 memory ratio = Decimal.ratio(amount, balanceOf(from));
 			uint amountFei = ratio.mul(feiBalances[from]).asUint256();
 			feiBalances[from] -= amountFei;
 			feiBalances[to] += amountFei;
        }
    }

	function totalTribe() internal view returns (uint) {
		return tribeBalance() + uint256(claimed);
	}
}