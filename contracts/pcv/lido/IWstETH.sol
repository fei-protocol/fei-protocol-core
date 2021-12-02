// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// wstETH Token contract specific functions
interface IWstETH is IERC20 {
    function stETH() external view returns (address);
    function getStETHByWstETH(uint256 _wstETHAmount) external view returns (uint256);
    function getWstETHByStETH(uint256 _stETHAmount) external view returns (uint256);
    function stEthPerToken() external view returns (uint256);
    function tokensPerStEth() external view returns (uint256);
    function wrap(uint256 _stETHAmount) external returns (uint256);
    function unwrap(uint256 _wstETHAmount) external returns (uint256);
}
