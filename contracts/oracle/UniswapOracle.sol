
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
// import '../external/UniswapV2OracleLibrary.sol';
import "../external/Decimal.sol";
import "./IOracle.sol";

contract UniswapOracle is IOracle {

	constructor(address _pair) public {

	}

	function update() external override returns (bool) {
		return true;
	}
    function read() external view override returns (Decimal.D256 memory, bool) {
    	return (Decimal.one(), true);
    }

}