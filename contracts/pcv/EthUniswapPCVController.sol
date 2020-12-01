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

	constructor (address core, address _pcvDeposit, address _oracle, address _incentiveContract) 
		UniRef(core)
	public {
		pcvDeposit = IUniswapPCVDeposit(_pcvDeposit);
		incentiveContract = IUniswapIncentive(_incentiveContract);
		setupPair(address(pcvDeposit.pair()));
		_setOracle(_oracle);
	}

	function forceReweight() public onlyGovernor {
		_reweight();
	}

	function reweight() public {
		require(incentiveContract.isIncentiveParity(address(pair)), "EthUniswapPCVController: Not at incentive parity");
		_reweight();
	}

	function setPCVDeposit(address _pcvDeposit) public onlyGovernor {
		pcvDeposit = IUniswapPCVDeposit(_pcvDeposit);
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
		Decimal.D256 memory peg = capture();
    	require(isBelowPeg(peg), "EthUniswapPCVController: already at or above peg");
    	Decimal.D256 memory ethPeg = invert(peg);
    	uint amountEth = getAmountToPeg(ethReserves, feiReserves, ethPeg); // need to flip peg to solve for ETH
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
		pair.swap(amountOut, amountOut, address(this), new bytes(0));
	}

	function withdrawAll() internal {
		uint value = pcvDeposit.totalValue();
		pcvDeposit.withdraw(address(this), value);
	}

	receive() external payable {

	}
}