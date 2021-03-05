pragma solidity ^0.6.0;

import "../genesis/IGenesisGroup.sol";

contract FlashGenesis {

    IGenesisGroup public genesis;

	constructor(address _genesis) public {
        genesis = IGenesisGroup(_genesis);
	}

	function zap(address to) public {
		genesis.launch();
        genesis.redeem(to);
	}
}

