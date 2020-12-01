pragma solidity ^0.6.2;

import "./IIncentive.sol";
interface IUniswapIncentive is IIncentive {
	function isIncentiveParity() external returns (bool);
}
