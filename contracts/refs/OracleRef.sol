pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../oracle/IOracle.sol";
import "../external/Decimal.sol";
import "../refs/CoreRef.sol";

contract OracleRef is CoreRef {
	using Decimal for Decimal.D256;

	IOracle public oracle;

	constructor(address _core) public
		CoreRef(_core) {}

	function setOracle(address _oracle) public onlyGovernor {
		_setOracle(_oracle);
	}

    function invert(Decimal.D256 memory price) public pure returns(Decimal.D256 memory) {
    	return Decimal.one().div(price);
    }

    function updateOracle() public returns(bool) {
    	return oracle.update();
    }

    function peg() public view returns(Decimal.D256 memory) {
    	(Decimal.D256 memory _peg, bool valid) = oracle.read();
    	require(valid, "OracleRef: oracle invalid");
    	return _peg;
    }

    function capture() internal returns(Decimal.D256 memory) {
    	updateOracle();
    	return peg();
    }

    function _setOracle(address _oracle) internal {
    	oracle = IOracle(_oracle);
    }
}