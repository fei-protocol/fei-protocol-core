pragma solidity ^0.6.2;

import "./IIncentive.sol";
interface IUniswapIncentive is IIncentive {
	function isIncentiveParity(address _pair) external returns (bool);
}
