pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IUniswapPCVDeposit.sol";
import "../refs/UniRef.sol";
import "../external/Decimal.sol";
import "../oracle/IOracle.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@openzeppelin/contracts/math/Math.sol";

contract EthUniswapPCVController is UniRef {
	using Decimal for Decimal.D256;

	IUniswapPCVDeposit public pcvDeposit;
	IOracle public oracle;

	constructor (address core, address _pcvDeposit, address _oracle) 
		UniRef(core)
	public {
		pcvDeposit = IUniswapPCVDeposit(_pcvDeposit);
		oracle = IOracle(_oracle);
		setupPair(address(pcvDeposit.pair()));
	}

	function forceReweight() public onlyGovernor {
		_reweight();
	}

	function setPCVDeposit(address _pcvDeposit) public onlyGovernor {
		pcvDeposit = IUniswapPCVDeposit(_pcvDeposit);
	}

	function setOracle(address _oracle) public onlyGovernor {
		oracle = IOracle(_oracle);
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
		(Decimal.D256 memory peg, bool valid) = oracle.capture();
    	require(valid, "EthUniswapPCVController: oracle error");
    	require(isBelowPeg(peg), "EthUniswapPCVController: already at or above peg");
    	Decimal.D256 memory ethPeg = Decimal.one().div(peg);
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