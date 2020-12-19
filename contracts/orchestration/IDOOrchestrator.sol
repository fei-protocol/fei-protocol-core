pragma solidity ^0.6.0;

import "../genesis/IDO.sol";
import "../dao/TimelockedDelegator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

contract IDOOrchestrator is Ownable {
	IDO public ido;
	TimelockedDelegator public timelockedDelegator;
	bool public deployed;
	uint constant public RELEASE_WINDOW = 4 * 365 * 24 * 60 * 60; // 4 years vesting

	address public constant UNISWAP_FACTORY = address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

	function init(address core, address admin, address tribe, address fei, address router) public onlyOwner {
		if(!deployed) {
			address pair = UniswapV2Library.pairFor(UNISWAP_FACTORY, fei, tribe);
			ido = new IDO(core, admin, RELEASE_WINDOW, pair, router);
			timelockedDelegator = new TimelockedDelegator(tribe, admin, RELEASE_WINDOW);
			deployed = true;
		}
	}
}