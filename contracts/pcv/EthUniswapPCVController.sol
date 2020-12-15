pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IUniswapPCVDeposit.sol";
import "../token/IUniswapIncentive.sol";
import "../refs/UniRef.sol";
import "../external/Decimal.sol";
import "../oracle/IOracle.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@openzeppelin/contracts/math/Math.sol";

contract EthUniswapPCVController is UniRef {
	using Decimal for Decimal.D256;

	IUniswapPCVDeposit public pcvDeposit;
	IUniswapIncentive public incentiveContract;
	uint public reweightIncentiveAmount;
	Decimal.D256 public minDistanceForReweight;

	constructor (address core, address _pcvDeposit, address _oracle, address _incentiveContract) public
		UniRef(core)
	{
		pcvDeposit = IUniswapPCVDeposit(_pcvDeposit);
		incentiveContract = IUniswapIncentive(_incentiveContract);
		setupPair(address(pcvDeposit.pair()));
		_setOracle(_oracle);
		reweightIncentiveAmount = 100 * (10 ** fei().decimals());
		minDistanceForReweight = Decimal.ratio(1, 100); // initial min is 1%
	}

	function forceReweight() public onlyGovernor {
		_reweight();
	}

	function reweight() public postGenesis {
		require(reweightEligible(), "EthUniswapPCVController: Not at incentive parity or not at min distance");
		_reweight();
		incentivize();
	}

	function reweightEligible() public view returns(bool) {
		bool magnitude = getDistanceToPeg().greaterThan(minDistanceForReweight);
		bool time = incentiveContract.isIncentiveParity();
		return magnitude && time;
	}

	function setPCVDeposit(address _pcvDeposit) public onlyGovernor {
		pcvDeposit = IUniswapPCVDeposit(_pcvDeposit);
	}

	function setReweightIncentive(uint amount) public onlyGovernor {
		reweightIncentiveAmount = amount;
	}

	function setReweightMinDistance(uint basisPoints) public onlyGovernor {
		minDistanceForReweight = Decimal.ratio(basisPoints, 10000);
	}

	function incentivize() internal ifMinterSelf {
		fei().mint(msg.sender, reweightIncentiveAmount);
	}

	function _reweight() internal {
		withdrawAll();
		returnToPeg();
		uint balance = address(this).balance;
		pcvDeposit.deposit{value: balance}(balance);
		burnFeiHeld();
	}

	function returnToPeg() internal {
		(uint feiReserves, uint ethReserves) = getReserves();
		if (feiReserves == 0 || ethReserves == 0) {
			return;
		}
		updateOracle();
    	require(isBelowPeg(peg()), "EthUniswapPCVController: already at or above peg");
    	uint amountEth = getAmountToPegOther();
    	swapEth(amountEth, ethReserves, feiReserves);
	}

	function swapEth(uint amountEth, uint ethReserves, uint feiReserves) internal {
		uint balance = address(this).balance;
		uint amount = Math.min(amountEth, balance);
		uint amountOut = UniswapV2Library.getAmountOut(amount, ethReserves, feiReserves);
		IWETH weth = IWETH(router.WETH());
		weth.deposit{value: amount}();
		weth.transfer(address(pair), amount);

		(uint256 amount0Out, uint256 amount1Out) = pair.token0() == address(weth) ? (uint256(0), amountOut) : (amountOut, uint256(0));
		pair.swap(amount0Out, amount1Out, address(this), new bytes(0));
	}

	function withdrawAll() internal {
		uint value = pcvDeposit.totalValue();
		pcvDeposit.withdraw(address(this), value);
	}

	receive() external payable {

	}
}