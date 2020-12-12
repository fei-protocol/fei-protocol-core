pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./refs/CoreRef.sol";
import "./external/Decimal.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";

contract Pool is CoreRef, ERC20 {
	using Decimal for Decimal.D256;

	uint public startTime;
	uint public endTime;
	uint public constant DURATION = 2 * 365 days;
	uint public claimed;
	uint public depositedFei;

    mapping (address => uint) public feiBalances;

	constructor(address core) public 
		CoreRef(core) 
		ERC20("Fei USD Pool", "poolFEI")
	{}

	function init() public postGenesis {
		startTime = now;
		endTime = startTime + DURATION;
	}

	function deposit(uint amount) public {
		require(startTime != 0, "Pool: Uninitialized");
		fei().transferFrom(msg.sender, address(this), amount);
		feiBalances[msg.sender] = amount;
		depositedFei += amount;
		uint poolFei = twfb(amount);
		require(poolFei != 0, "Pool: Window has ended");
		_mint(msg.sender, poolFei);
	}

	function withdraw() public returns(uint amountFei, uint amountTribe) {
		amountFei = feiBalances[msg.sender];
		amountTribe = userRedeemableTribe(msg.sender);
		claimed += amountTribe;
		uint amountPoolFei = balanceOf(msg.sender);
		_burn(msg.sender, amountPoolFei);
		feiBalances[msg.sender] = 0;
		fei().transfer(msg.sender, amountFei);
		tribe().transfer(msg.sender, amountTribe);
		return (amountFei, amountTribe);
	}

	function claim() public returns(uint) {
		(uint amountFei, uint amountTribe) = withdraw();
		deposit(amountFei);
		return amountTribe;
	}

    function userRedeemableTribe(address account) public view returns(uint) {
		releasedTribe() * userRedeemablePoolFEI(account) / totalRedeemablePoolFEI();
    }

	function totalRedeemablePoolFEI() public view returns(uint) {
		return totalSupply() - twfb(depositedFei);
	}

	function userRedeemablePoolFEI(address account) public view returns(uint) {
		return balanceOf(account) - twfb(feiBalances[account]);
	}

	function releasedTribe() public view returns (uint) {
		return tribeBalance() - unreleasedTribe();
	}

	function unreleasedTribe() public view returns (uint) {
		uint tribeAmount = totalTribe();
		uint duration = DURATION;
		uint t = timestamp();
		if(t == duration) {
			return 0;
		}
		Decimal.D256 memory start = Decimal.ratio(tribeAmount, duration).mul(2).mul(t);
		Decimal.D256 memory end = Decimal.ratio(tribeAmount, duration).div(duration).mul(t * t);
		return start.sub(end).sub(tribeAmount).asUint256();
	}

	function twfb(uint amount) public view returns(uint) {
		return amount * remainingTime();
	}

	function remainingTime() public view returns(uint) {
		return DURATION - timestamp();
	}

	function timestamp() public view returns(uint) {
		return Math.min(now - startTime, DURATION);
	}

	function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0)) {
 			Decimal.D256 memory ratio = Decimal.ratio(amount, balanceOf(from));
 			uint amountFei = ratio.mul(feiBalances[from]).asUint256();
 			feiBalances[from] -= amountFei;
 			feiBalances[to] += amountFei;
        }
    }

	function totalTribe() internal view returns (uint) {
		return tribeBalance() + claimed;
	}
}