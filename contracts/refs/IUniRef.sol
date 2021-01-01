pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../external/Decimal.sol";

/// @title A Uniswap Reference contract
/// @author Fei Protocol
/// @notice defines some modifiers and utilities around interacting with Uniswap
/// @dev the uniswap pair should be FEI and another asset
interface IUniRef {

	// ----------- Events -----------

    event PairUpdate(address indexed _pair);

    // ----------- Governor only state changing api -----------

    /// @notice set the new pair contract
    /// @param _pair the new pair
    /// @dev also approves the router for the new pair token and underlying token
    function setPair(address _pair) external;

    // ----------- Getters -----------

    /// @notice the Uniswap router contract
    /// @return the IUniswapV2Router02 router implementation address
    function router() external view returns(IUniswapV2Router02);

    /// @notice the referenced Uniswap pair contract
    /// @return the IUniswapV2Pair router implementation address
    function pair() external view returns(IUniswapV2Pair);

    /// @notice the address of the non-fei underlying token
    /// @return the token address
    function token() external view returns(address);

    /// @notice pair reserves with fei listed first
    /// @dev uses the max of pair fei balance and fei reserves. Mitigates attack vectors which manipulate the pair balance
    function getReserves() external view returns (uint feiReserves, uint tokenReserves);

    /// @notice amount of pair liquidity owned by this contract
    /// @return amount of LP tokens
	function liquidityOwned() external view returns (uint);
}