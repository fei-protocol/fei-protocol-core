pragma solidity ^0.8.0;

import "./PCVSplitter.sol";

/// @title ERC20Splitter
/// @notice a contract to split token held to multiple locations
contract ERC20Splitter is PCVSplitter {

    /// @notice token to split
    IERC20 public token;

    /**
        @notice constructor for ERC20Splitter
        @param _core the Core address to reference
        @param _token the ERC20 token instance to split
        @param _pcvDeposits the locations to send tokens
        @param _ratios the relative ratios of how much tokens to send each location, in basis points
    */
    constructor(
        address _core,
        IERC20 _token,
        address[] memory _pcvDeposits,
        uint256[] memory _ratios
    ) 
        CoreRef(_core)
        PCVSplitter(_pcvDeposits, _ratios)
    {
        token = _token;
    }

    /// @notice distribute held TRIBE
    function allocate() external whenNotPaused {
        _allocate(token.balanceOf(address(this)));
    }

    function _allocateSingle(uint256 amount, address pcvDeposit) internal override {
        token.transfer(pcvDeposit, amount);        
    }
}