pragma solidity ^0.6.0;
import "../genesis/GenesisGroup.sol";

contract MockGenesisGroupOrchestrator {

    address public genesisGroup;

	constructor(
		address _core, 
		address _bondingcurve,
		address _ido,
		uint _duration,
		uint _maxPriceBPs,
		uint _exchangeRateDiscount
	) public {
       	genesisGroup = address(new GenesisGroup(
	       	_core, 
			_bondingcurve,
			_ido,
			_duration,
			_maxPriceBPs,
			_exchangeRateDiscount
		));
    }

    function launchGovernance() external {}
}