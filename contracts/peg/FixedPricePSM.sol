pragma solidity ^0.8.4;

import "./PriceBoundPSM.sol";

contract FixedPricePSM is PriceBoundPSM {
    using Decimal for Decimal.D256;

    constructor(
        uint256 _floor,
        uint256 _ceiling,
        OracleParams memory _params,
        MultiRateLimitedParams memory _multiRateLimitedParams,
        PSMParams memory _psmParams
    )
        PriceBoundPSM(
            _floor,
            _ceiling,
            _params,
            _multiRateLimitedParams,
            _psmParams
        )
    {}

    // ----------- Internal Methods -----------

    /// @notice helper function to get mint amount out based on current market prices
    /// @dev will revert if price is outside of bounds and bounded PSM is being used
    function _getMintAmountOut(uint256 amountIn)
        internal
        view
        virtual
        override
        returns (uint256 amountFeiOut)
    {
        Decimal.D256 memory price = readOracle();
        _validatePriceRange(price);

        amountFeiOut = Decimal
            .one()
            .mul(amountIn)
            .mul(Constants.BASIS_POINTS_GRANULARITY - mintFeeBasisPoints)
            .div(Constants.BASIS_POINTS_GRANULARITY)
            .asUint256();
    }

    /// @notice helper function to get redeem amount out based on current market prices
    /// @dev will revert if price is outside of bounds and bounded PSM is being used
    function _getRedeemAmountOut(uint256 amountFeiIn)
        internal
        view
        virtual
        override
        returns (uint256 amountTokenOut)
    {
        Decimal.D256 memory price = readOracle();
        _validatePriceRange(price);

        amountTokenOut = Decimal
            .one()
            .mul(amountFeiIn)
            .mul(Constants.BASIS_POINTS_GRANULARITY - redeemFeeBasisPoints)
            .div(Constants.BASIS_POINTS_GRANULARITY)
            .asUint256();
    }
}
