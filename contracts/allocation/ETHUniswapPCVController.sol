pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IAllocation.sol";
import "../core/CoreRef.sol";
import "../external/Decimal.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../oracle/IOracle.sol";

abstract contract ETHUniswapPCVController is IAllocation, CoreRef {
	using Decimal for Decimal.D256;

	IAllocation public pcvDeposit;
	IOracle public oracle

	constructor (address core, address _pcvDeposit, address _oracle) 
		CoreRef(core)
	public {
		pcvDeposit = IAllocation(_pcvDeposit);
		oracle = IOracle(_oracle);
	}

	function forceReweight() public onlyGovernor {
		_reweight();
	}


	function setPCVDeposit(address _pair) public onlyGovernor {
		pcvDeposit = IAllocation(_pcvDeposit);
	}

	function _reweight() internal {
		withdrawAll();
	}

	function withdrawAll() internal {
		uint value = pcvDeposit().totalValue();
		pcvDeposit().withdraw(address(this), value);
	}


	function getReserves() public view returns (uint feiReserves, uint tokenReserves) {
		address token0 = pair().token0();
        (uint reserve0, uint reserve1,) = pair().getReserves();
        (feiReserves, tokenReserves) = address(fei()) == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
	}

    function burnFeiHeld() internal {
    	uint256 balance = fei().balanceOf(address(this));
    	fei().burn(balance);
    }

}