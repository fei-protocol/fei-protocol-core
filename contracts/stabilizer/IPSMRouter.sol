pragma solidity ^0.8.4;

interface IPSMRouter {

    /// @notice Default mint if no calldata supplied
    /// @dev we don't use fallback here because fallback is only called if the function selector doesn't exist,
    /// and we actually want to revert in case someone made a mistake. Note that receive() cannot return values.
    receive() external payable;

    /// @notice Mints fei to the given address, with a minimum amount required
    /// @dev This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.
    /// @param _to The address to mint fei to
    /// @param _minAmountOut The minimum amount of fei to mint
    function mint(address _to, uint256 _minAmountOut) external payable returns (uint256);
}