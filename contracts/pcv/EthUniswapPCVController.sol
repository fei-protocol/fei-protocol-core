pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "./IUniswapPCVController.sol";
import "../refs/UniRef.sol";
import "../oracle/IOracle.sol";
import "../external/Decimal.sol";

/// @title a IUniswapPCVController implementation for ETH
/// @author Fei Protocol
contract EthUniswapPCVController is IUniswapPCVController, UniRef {
	using Decimal for Decimal.D256;

	IPCVDeposit public override pcvDeposit;
	IUniswapIncentive public override incentiveContract;

	uint public override reweightIncentiveAmount;
	Decimal.D256 public minDistanceForReweight;

	/// @notice EthUniswapPCVController constructor
	/// @param _core Fei Core for reference
	/// @param _pcvDeposit PCV Deposit to reweight
	/// @param _oracle oracle for reference
	/// @param _incentiveContract incentive contract for reference
	/// @param _incentiveAmount amount of FEI for triggering a reweight
	/// @param _minDistanceForReweightBPs minimum distance from peg to reweight in basis points
	/// @param _pair Uniswap pair contract to reweight
	/// @param _router Uniswap Router
	constructor (
		address _core, 
		address _pcvDeposit, 
		address _oracle, 
		address _incentiveContract,
		uint _incentiveAmount,
		uint _minDistanceForReweightBPs,
		address _pair,
		address _router
	) public
		UniRef(_core, _pair, _router, _oracle)
	{
		pcvDeposit = IPCVDeposit(_pcvDeposit);
		incentiveContract = IUniswapIncentive(_incentiveContract);

		reweightIncentiveAmount = _incentiveAmount;
		minDistanceForReweight = Decimal.ratio(_minDistanceForReweightBPs, 10000);
	}

	receive() external payable {}

	function reweight() external override postGenesis {
		require(reweightEligible(), "EthUniswapPCVController: Not at incentive parity or not at min distance");
		_reweight();
		_incentivize();
	}

	function forceReweight() external override onlyGovernor {
		_reweight();
	}

	function setPCVDeposit(address _pcvDeposit) external override onlyGovernor {
		pcvDeposit = IPCVDeposit(_pcvDeposit);
		emit PCVDepositUpdate(_pcvDeposit);
	}

	function setReweightIncentive(uint amount) external override onlyGovernor {
		reweightIncentiveAmount = amount;
		emit ReweightIncentiveUpdate(amount);
	}

	function setReweightMinDistance(uint basisPoints) external override onlyGovernor {
		minDistanceForReweight = Decimal.ratio(basisPoints, 10000);
		emit ReweightMinDistanceUpdate(basisPoints);
	}

	function reweightEligible() public view override returns(bool) {
		bool magnitude = getDistanceToPeg().greaterThan(minDistanceForReweight);
		bool time = incentiveContract.isIncentiveParity();
		return magnitude && time;
	}

	function _incentivize() internal ifMinterSelf {
		fei().mint(msg.sender, reweightIncentiveAmount);
	}

	function _reweight() internal {
		_withdrawAll();
		_returnToPeg();

		uint balance = address(this).balance;
		pcvDeposit.deposit{value: balance}(balance);

		_burnFeiHeld();

		emit Reweight(msg.sender);
	}

	function _returnToPeg() internal {
		(uint feiReserves, uint ethReserves) = getReserves();
		if (feiReserves == 0 || ethReserves == 0) {
			return;
		}

		updateOracle();

    	require(isBelowPeg(peg()), "EthUniswapPCVController: already at or above peg");
    	
		uint amountEth = getAmountToPegOther();
    	_swapEth(amountEth, ethReserves, feiReserves);
	}

	function _swapEth(uint amountEth, uint ethReserves, uint feiReserves) internal {
		uint balance = address(this).balance;
		uint amount = Math.min(amountEth, balance);
		
		uint amountOut = UniswapV2Library.getAmountOut(amount, ethReserves, feiReserves);
		
		IWETH weth = IWETH(router.WETH());
		weth.deposit{value: amount}();
		weth.transfer(address(pair), amount);

		(uint amount0Out, uint amount1Out) = pair.token0() == address(weth) ? (uint(0), amountOut) : (amountOut, uint(0));
		pair.swap(amount0Out, amount1Out, address(this), new bytes(0));
	}

	function _withdrawAll() internal {
		uint value = pcvDeposit.totalValue();
		pcvDeposit.withdraw(address(this), value);
	}
}