pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IOracleRef.sol";
import "./CoreRef.sol";

/// @title Abstract implementation of IOracleRef
/// @author Fei Protocol
abstract contract OracleRef is IOracleRef, CoreRef {
	using Decimal for Decimal.D256;

	IOracle public override oracle;

	/// @notice OracleRef constructor
	/// @param _core Fei Core to reference
	/// @param _oracle oracle to reference
	constructor(address _core, address _oracle) public CoreRef(_core) {
        _setOracle(_oracle);
    }

	function setOracle(address _oracle) external override onlyGovernor {
		_setOracle(_oracle);
        emit OracleUpdate(_oracle);
	}

    function invert(Decimal.D256 memory price) public override pure returns(Decimal.D256 memory) {
    	return Decimal.one().div(price);
    }

    function updateOracle() public override returns(bool) {
    	return oracle.update();
    }

    function peg() public override view returns(Decimal.D256 memory) {
    	(Decimal.D256 memory _peg, bool valid) = oracle.read();
    	require(valid, "OracleRef: oracle invalid");
    	return _peg;
    }

    function _setOracle(address _oracle) internal {
    	oracle = IOracle(_oracle);
    }
}