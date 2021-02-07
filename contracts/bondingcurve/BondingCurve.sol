pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/Math.sol";
import "./IBondingCurve.sol";
import "../utils/Roots.sol";
import "../refs/OracleRef.sol";
import "../pcv/PCVSplitter.sol";
import "../utils/Timed.sol";

/// @title an abstract bonding curve for purchasing FEI
/// @author Fei Protocol
abstract contract BondingCurve is IBondingCurve, OracleRef, PCVSplitter, Timed {
    using Decimal for Decimal.D256;
    using Roots for uint256;

    uint256 public override scale;
    uint256 public override totalPurchased; // FEI_b for this curve

    uint256 public override buffer = 100;
    uint256 public constant BUFFER_GRANULARITY = 10_000;

    uint256 public override incentiveAmount;

    /// @notice constructor
    /// @param _scale the Scale target where peg fixes
    /// @param _core Fei Core to reference
    /// @param _pcvDeposits the PCV Deposits for the PCVSplitter
    /// @param _ratios the ratios for the PCVSplitter
    /// @param _oracle the UniswapOracle to reference
    /// @param _duration the duration between incentivizing allocations
    /// @param _incentive the amount rewarded to the caller of an allocation
    constructor(
        uint256 _scale,
        address _core,
        address[] memory _pcvDeposits,
        uint256[] memory _ratios,
        address _oracle,
        uint256 _duration,
        uint256 _incentive
    )
        public
        OracleRef(_core, _oracle)
        PCVSplitter(_pcvDeposits, _ratios)
        Timed(_duration)
    {
        _setScale(_scale);
        incentiveAmount = _incentive;
    }

    function setScale(uint256 _scale) external override onlyGovernor {
        _setScale(_scale);
    }

    function setBuffer(uint256 _buffer) external override onlyGovernor {
        require(
            _buffer < BUFFER_GRANULARITY,
            "BondingCurve: Buffer exceeds or matches granularity"
        );
        buffer = _buffer;
        emit BufferUpdate(_buffer);
    }

    function setAllocation(
        address[] calldata allocations,
        uint256[] calldata ratios
    ) external override onlyGovernor {
        _setAllocation(allocations, ratios);
    }

    function allocate() external override {
        uint256 amount = getTotalPCVHeld();
        require(amount != 0, "BondingCurve: No PCV held");

        _allocate(amount);
        _incentivize();

        emit Allocate(msg.sender, amount);
    }

    function atScale() public view override returns (bool) {
        return totalPurchased >= scale;
    }

    function getCurrentPrice()
        public
        view
        override
        returns (Decimal.D256 memory)
    {
        if (atScale()) {
            return peg().mul(_getBuffer());
        }
        return peg().div(_getBondingCurvePriceMultiplier());
    }

    function getAmountOut(uint256 amountIn)
        public
        view
        override
        returns (uint256 amountOut)
    {
        uint256 adjustedAmount = _getAdjustedAmount(amountIn);
        amountOut = _getBufferAdjustedAmount(adjustedAmount);
        if (atScale()) {
            return amountOut;
        }
        return Math.max(amountOut, _getBondingCurveAmountOut(adjustedAmount)); // Cap price at buffer adjusted
    }

    function getAveragePrice(uint256 amountIn)
        public
        view
        override
        returns (Decimal.D256 memory)
    {
        uint256 adjustedAmount = _getAdjustedAmount(amountIn);
        uint256 amountOut = getAmountOut(amountIn);
        return Decimal.ratio(adjustedAmount, amountOut);
    }

    function getTotalPCVHeld() public view virtual override returns (uint256);

    function _getAdjustedAmount(uint256 amountIn)
        internal
        view
        returns (uint256)
    {
        return peg().mul(amountIn).asUint256();
    }

    function _purchase(uint256 amountIn, address to)
        internal
        returns (uint256 amountOut)
    {
        updateOracle();

        amountOut = getAmountOut(amountIn);
        _incrementTotalPurchased(amountOut);
        fei().mint(to, amountOut);

        emit Purchase(to, amountIn, amountOut);

        return amountOut;
    }

    function _incrementTotalPurchased(uint256 amount) internal {
        totalPurchased = totalPurchased.add(amount);
    }

    function _setScale(uint256 _scale) internal {
        scale = _scale;
        emit ScaleUpdate(_scale);
    }

    function _incentivize() internal virtual {
        if (isTimeEnded()) {
            _initTimed();
            fei().mint(msg.sender, incentiveAmount);
        }
    }

    function _getBondingCurvePriceMultiplier()
        internal
        view
        virtual
        returns (Decimal.D256 memory);

    function _getBondingCurveAmountOut(uint256 adjustedAmountIn)
        internal
        view
        virtual
        returns (uint256);

    function _getBuffer() internal view returns (Decimal.D256 memory) {
        uint256 granularity = BUFFER_GRANULARITY;
        return Decimal.ratio(granularity - buffer, granularity);
    }

    function _getBufferAdjustedAmount(uint256 amountIn)
        internal
        view
        returns (uint256)
    {
        return _getBuffer().mul(amountIn).asUint256();
    }
}