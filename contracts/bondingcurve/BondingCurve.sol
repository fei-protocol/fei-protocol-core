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

    /// @notice the Scale target at which bonding curve price fixes
    uint256 public override scale;

    /// @notice the total amount of FEI purchased on bonding curve. FEI_b from the whitepaper
    uint256 public override totalPurchased; // FEI_b for this curve

    /// @notice the buffer applied on top of the peg purchase price once at Scale
    uint256 public override buffer = 100;
    uint256 public constant BUFFER_GRANULARITY = 10_000;

    /// @notice amount of FEI paid for allocation when incentivized
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

        _initTimed();
    }

    /// @notice sets the bonding curve Scale target
    function setScale(uint256 _scale) external override onlyGovernor {
        _setScale(_scale);
    }

    /// @notice sets the bonding curve price buffer
    function setBuffer(uint256 _buffer) external override onlyGovernor {
        require(
            _buffer < BUFFER_GRANULARITY,
            "BondingCurve: Buffer exceeds or matches granularity"
        );
        buffer = _buffer;
        emit BufferUpdate(_buffer);
    }

    /// @notice sets the allocation of incoming PCV
    function setAllocation(
        address[] calldata allocations,
        uint256[] calldata ratios
    ) external override onlyGovernor {
        _setAllocation(allocations, ratios);
    }

    /// @notice batch allocate held PCV
    function allocate() external override postGenesis whenNotPaused nonContract {
        uint256 amount = getTotalPCVHeld();
        require(amount != 0, "BondingCurve: No PCV held");

        _allocate(amount);
        _incentivize();

        emit Allocate(msg.sender, amount);
    }

    /// @notice a boolean signalling whether Scale has been reached
    function atScale() public view override returns (bool) {
        return totalPurchased >= scale;
    }

    /// @notice return current instantaneous bonding curve price
    /// @return price reported as FEI per X with X being the underlying asset
    /// @dev Can be innacurate if outdated, need to call `oracle().isOutdated()` to check
    function getCurrentPrice()
        public
        view
        override
        returns (Decimal.D256 memory)
    {
        if (atScale()) {
            return peg().mul(_getBufferMultiplier());
        }
        return peg().div(_getBondingCurvePriceMultiplier());
    }

    /// @notice return amount of FEI received after a bonding curve purchase
    /// @param amountIn the amount of underlying used to purchase
    /// @return amountOut the amount of FEI received
    /// @dev Can be innacurate if outdated, need to call `oracle().isOutdated()` to check
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

    /// @notice return the average price of a transaction along bonding curve
    /// @param amountIn the amount of underlying used to purchase
    /// @return price reported as USD per FEI
    /// @dev Can be innacurate if outdated, need to call `oracle().isOutdated()` to check
    function getAverageUSDPrice(uint256 amountIn)
        public
        view
        override
        returns (Decimal.D256 memory)
    {
        uint256 adjustedAmount = _getAdjustedAmount(amountIn);
        uint256 amountOut = getAmountOut(amountIn);
        return Decimal.ratio(adjustedAmount, amountOut);
    }

    /// @notice the amount of PCV held in contract and ready to be allocated
    function getTotalPCVHeld() public view virtual override returns (uint256);

    /// @notice multiplies amount in by the peg to convert to FEI
    function _getAdjustedAmount(uint256 amountIn)
        internal
        view
        returns (uint256)
    {
        return peg().mul(amountIn).asUint256();
    }

    /// @notice mint FEI and send to buyer destination
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

    /// @notice if window has passed, reward caller and reset window
    function _incentivize() internal virtual {
        if (isTimeEnded()) {
            _initTimed(); // reset window
            fei().mint(msg.sender, incentiveAmount);
        }
    }

    /// @notice the bonding curve price multiplier at the current totalPurchased relative to Scale
    function _getBondingCurvePriceMultiplier()
        internal
        view
        virtual
        returns (Decimal.D256 memory);

    /// @notice returns the integral of the bonding curve solved for the amount of tokens out for a certain amount of value in
    /// @param adjustedAmountIn this is the value in FEI of the underlying asset coming in
    function _getBondingCurveAmountOut(uint256 adjustedAmountIn)
        internal
        view
        virtual
        returns (uint256);

    /// @notice returns the buffer on the post-scale bonding curve price
    function _getBufferMultiplier() internal view returns (Decimal.D256 memory) {
        uint256 granularity = BUFFER_GRANULARITY;
        // uses granularity - buffer (i.e. 1-b) instead of 1+b because the peg is inverted
        return Decimal.ratio(granularity - buffer, granularity);
    }

    function _getBufferAdjustedAmount(uint256 amountIn)
        internal
        view
        returns (uint256)
    {
        return _getBufferMultiplier().mul(amountIn).asUint256();
    }
}
