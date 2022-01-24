pragma solidity ^0.8.4;

import "./PriceBoundPSM.sol";

contract SafePSM is PriceBoundPSM {

    /// @notice the oracle reference by the contract
    IOracle public actualPriceOracle;

    constructor(
        uint256 _floor,
        uint256 _ceiling,
        OracleParams memory _params,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        IERC20 _underlyingToken,
        IPCVDeposit _surplusTarget,
        IOracle _actualPriceOracle
    ) PriceBoundPSM(
        _floor,
        _ceiling,
        _params,
        _mintFeeBasisPoints,
        _redeemFeeBasisPoints,
        _reservesThreshold,
        _feiLimitPerSecond,
        _mintingBufferCap,
        _underlyingToken,
        _surplusTarget
    ) {
        actualPriceOracle = _actualPriceOracle;
    }

    /// @notice the price of the referenced oracle
    /// @return the peg as a Decimal
    /// @dev the peg is defined as FEI per X with X being ETH, dollars, etc
    function readActualOracle() public view returns (Decimal.D256 memory) {
        (Decimal.D256 memory _peg, bool valid) = actualPriceOracle.read();
        require(valid, "SafePSM: oracle price invalid");

        return _peg;
    }

    /// @notice gas optimization, remove bounds check on fixed price oracle
    /// we can just assume that this always returns properly
    function _validatePriceRange(Decimal.D256 memory) internal view virtual override {
        require(_validPrice(readActualOracle()), "SafePSM: price out of bounds");
    }
}
