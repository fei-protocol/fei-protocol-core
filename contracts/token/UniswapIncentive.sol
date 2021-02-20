pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/Math.sol";
import "./IUniswapIncentive.sol";
import "../utils/SafeMath32.sol";
import "../refs/UniRef.sol";

/// @title Uniswap trading incentive contract
/// @author Fei Protocol
/// @dev incentives are only appplied if the contract is appointed as a Minter or Burner, otherwise skipped
contract UniswapIncentive is IUniswapIncentive, UniRef {
    using Decimal for Decimal.D256;
    using SafeMath32 for uint32;
    using SafeMathCopy for uint256;

    struct TimeWeightInfo {
        uint32 blockNo;
        uint32 weight;
        uint32 growthRate;
        bool active;
    }

    TimeWeightInfo private timeWeightInfo;

    /// @notice the granularity of the time weight and growth rate
    uint32 public constant override TIME_WEIGHT_GRANULARITY = 100_000;

    mapping(address => bool) private _exempt;
    mapping(address => bool) private _allowlist;

    /// @notice UniswapIncentive constructor
    /// @param _core Fei Core to reference
    /// @param _oracle Oracle to reference
    /// @param _pair Uniswap Pair to incentivize
    /// @param _router Uniswap Router
    constructor(
        address _core,
        address _oracle,
        address _pair,
        address _router,
        uint32 _growthRate
    ) public UniRef(_core, _pair, _router, _oracle) {
        _setTimeWeight(0, _growthRate, false);
    }

    function incentivize(
        address sender,
        address receiver,
        address operator,
        uint256 amountIn
    ) external override onlyFei {
        require(sender != receiver, "UniswapIncentive: cannot send self");
        updateOracle();

        if (_isPair(sender)) {
            _incentivizeBuy(receiver, amountIn);
        }

        if (_isPair(receiver)) {
            require(
                isSellAllowlisted(sender) || isSellAllowlisted(operator),
                "UniswapIncentive: Blocked Fei sender or operator"
            );
            _incentivizeSell(sender, amountIn);
        }
    }

    /// @notice set an address to be exempted from Uniswap trading incentives
    /// @param account the address to update
    /// @param isExempt a flag for whether to exempt or unexempt
    function setExemptAddress(address account, bool isExempt)
        external
        override
        onlyGovernor
    {
        _exempt[account] = isExempt;
        emit ExemptAddressUpdate(account, isExempt);
    }

    /// @notice set an address to be able to send tokens to Uniswap
    /// @param account the address to update
    /// @param isAllowed a flag for whether the account is allowed to sell or not
    function setSellAllowlisted(address account, bool isAllowed)
        external
        override
        onlyGuardianOrGovernor
    {
        _allowlist[account] = isAllowed;
        emit SellAllowedAddressUpdate(account, isAllowed);
    }

    /// @notice set the time weight growth function
    function setTimeWeightGrowth(uint32 growthRate)
        external
        override
        onlyGovernor
    {
        TimeWeightInfo memory tw = timeWeightInfo;
        timeWeightInfo = TimeWeightInfo(
            tw.blockNo,
            tw.weight,
            growthRate,
            tw.active
        );
        emit GrowthRateUpdate(growthRate);
    }

    /// @notice sets all of the time weight parameters
    /// @param weight the stored last time weight
    /// @param growth the growth rate of the time weight per block
    /// @param active a flag signifying whether the time weight is currently growing or not
    function setTimeWeight(
        uint32 weight,
        uint32 growth,
        bool active
    ) external override onlyGovernor {
        _setTimeWeight(weight, growth, active);
    }

    /// @notice the growth rate of the time weight per block
    function getGrowthRate() public view override returns (uint32) {
        return timeWeightInfo.growthRate;
    }

    /// @notice the time weight of the current block
    /// @dev factors in the stored block number and growth rate if active
    function getTimeWeight() public view override returns (uint32) {
        TimeWeightInfo memory tw = timeWeightInfo;
        if (!tw.active) {
            return 0;
        }

        uint32 blockDelta = block.number.toUint32().sub(tw.blockNo);
        return tw.weight.add(blockDelta * tw.growthRate);
    }

    /// @notice returns true if time weight is active and growing at the growth rate
    function isTimeWeightActive() public view override returns (bool) {
        return timeWeightInfo.active;
    }

    /// @notice returns true if account is marked as exempt
    function isExemptAddress(address account)
        public
        view
        override
        returns (bool)
    {
        return _exempt[account];
    }

    /// @notice return true if the account is approved to sell to the Uniswap pool
    function isSellAllowlisted(address account)
        public
        view
        override
        returns (bool)
    {
        return _allowlist[account];
    }

    /// @notice return true if burn incentive equals mint
    function isIncentiveParity() public view override returns (bool) {
        uint32 weight = getTimeWeight();
        require(weight != 0, "UniswapIncentive: Incentive zero or not active");

        (Decimal.D256 memory price, , ) = _getUniswapPrice();
        Decimal.D256 memory deviation = _deviationBelowPeg(price, peg());
        require(
            !deviation.equals(Decimal.zero()),
            "UniswapIncentive: Price already at or above peg"
        );

        Decimal.D256 memory incentive = _calculateBuyIncentiveMultiplier(deviation, weight);
        Decimal.D256 memory penalty = _calculateSellPenaltyMultiplier(deviation);
        return incentive.equals(penalty);
    }

    /// @notice get the incentive amount of a buy transfer
    /// @param amount the FEI size of the transfer
    /// @return incentive the FEI size of the mint incentive
    /// @return weight the time weight of thhe incentive
    /// @return initialDeviation the Decimal deviation from peg before a transfer
    /// @return finalDeviation the Decimal deviation from peg after a transfer
    /// @dev calculated based on a hypothetical buy, applies to any ERC20 FEI transfer from the pool
    function getBuyIncentive(uint256 amount)
        public
        view
        override
        returns (
            uint256 incentive,
            uint32 weight,
            Decimal.D256 memory initialDeviation,
            Decimal.D256 memory finalDeviation
        )
    {
        int256 signedAmount = amount.toInt256();
        // A buy withdraws FEI from uni so use negative amountIn
        (initialDeviation, finalDeviation) = _getPriceDeviations(
            -1 * signedAmount
        );
        weight = getTimeWeight();

        // buy started above peg
        if (initialDeviation.equals(Decimal.zero())) {
            return (0, weight, initialDeviation, finalDeviation);
        }

        uint256 incentivizedAmount = amount;
        // if buy ends above peg, only incentivize amount to peg
        if (finalDeviation.equals(Decimal.zero())) {
            incentivizedAmount = _getAmountToPegFei();
        }

        Decimal.D256 memory multiplier =
            _calculateBuyIncentiveMultiplier(initialDeviation, weight);
        incentive = multiplier.mul(incentivizedAmount).asUint256();
        return (incentive, weight, initialDeviation, finalDeviation);
    }

    /// @notice get the burn amount of a sell transfer
    /// @param amount the FEI size of the transfer
    /// @return penalty the FEI size of the burn incentive
    /// @return initialDeviation the Decimal deviation from peg before a transfer
    /// @return finalDeviation the Decimal deviation from peg after a transfer
    /// @dev calculated based on a hypothetical sell, applies to any ERC20 FEI transfer to the pool
    function getSellPenalty(uint256 amount)
        public
        view
        override
        returns (
            uint256 penalty,
            Decimal.D256 memory initialDeviation,
            Decimal.D256 memory finalDeviation
        )
    {
        int256 signedAmount = amount.toInt256();
        (initialDeviation, finalDeviation) = _getPriceDeviations(signedAmount);

        // if trafe ends above peg, it was always above peg and no penalty needed
        if (finalDeviation.equals(Decimal.zero())) {
            return (0, initialDeviation, finalDeviation);
        }

        uint256 incentivizedAmount = amount;
        // if trade started above but ended below, only penalize amount going below peg
        if (initialDeviation.equals(Decimal.zero())) {
            uint256 amountToPeg = _getAmountToPegFei();
            incentivizedAmount = amount.sub(
                amountToPeg,
                "UniswapIncentive: Underflow"
            );
        }

        Decimal.D256 memory multiplier =
            _calculateSellPenaltyMultiplier(finalDeviation);
        penalty = multiplier.mul(incentivizedAmount).asUint256();
        return (penalty, initialDeviation, finalDeviation);
    }

    function _incentivizeBuy(address target, uint256 amountIn)
        internal
        ifMinterSelf
    {
        if (isExemptAddress(target)) {
            return;
        }

        (
            uint256 incentive,
            uint32 weight,
            Decimal.D256 memory initialDeviation,
            Decimal.D256 memory finalDeviation
        ) = getBuyIncentive(amountIn);

        _updateTimeWeight(initialDeviation, finalDeviation, weight);
        if (incentive != 0) {
            fei().mint(target, incentive);
        }
    }

    function _incentivizeSell(address target, uint256 amount)
        internal
        ifBurnerSelf
    {
        if (isExemptAddress(target)) {
            return;
        }

        (
            uint256 penalty,
            Decimal.D256 memory initialDeviation,
            Decimal.D256 memory finalDeviation
        ) = getSellPenalty(amount);

        uint32 weight = getTimeWeight();
        _updateTimeWeight(initialDeviation, finalDeviation, weight);

        if (penalty != 0) {
            fei().burnFrom(target, penalty);
        }
    }

    function _calculateBuyIncentiveMultiplier(
        Decimal.D256 memory deviation,
        uint32 weight
    ) internal pure returns (Decimal.D256 memory) {
        Decimal.D256 memory correspondingPenalty =
            _calculateSellPenaltyMultiplier(deviation);
        Decimal.D256 memory buyMultiplier =
            deviation.mul(uint256(weight)).div(
                uint256(TIME_WEIGHT_GRANULARITY)
            );

        if (correspondingPenalty.lessThan(buyMultiplier)) {
            return correspondingPenalty;
        }

        return buyMultiplier;
    }

    function _calculateSellPenaltyMultiplier(Decimal.D256 memory deviation)
        internal
        pure
        returns (Decimal.D256 memory)
    {
        return deviation.mul(deviation).mul(100); // m^2 * 100
    }

    function _updateTimeWeight(
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation,
        uint32 currentWeight
    ) internal {
        // Reset when trade ends above peg
        if (finalDeviation.equals(Decimal.zero())) {
            _setTimeWeight(0, getGrowthRate(), false);
            return;
        }
        // when trade starts above peg but ends below, activate time weight
        if (initialDeviation.equals(Decimal.zero())) {
            _setTimeWeight(0, getGrowthRate(), true);
            return;
        }

        // when trade starts and ends below the peg, update the values
        uint256 updatedWeight = uint256(currentWeight);
        // Partial buy should update time weight
        if (initialDeviation.greaterThan(finalDeviation)) {
            Decimal.D256 memory remainingRatio =
                finalDeviation.div(initialDeviation);
            updatedWeight = remainingRatio
                .mul(uint256(currentWeight))
                .asUint256();
        }

        // cap incentive at max penalty
        uint256 maxWeight =
            finalDeviation
                .mul(100)
                .mul(uint256(TIME_WEIGHT_GRANULARITY))
                .asUint256(); // m^2*100 (sell) = t*m (buy)
        updatedWeight = Math.min(updatedWeight, maxWeight);
        _setTimeWeight(updatedWeight.toUint32(), getGrowthRate(), true);
    }

    function _setTimeWeight(
        uint32 weight,
        uint32 growthRate,
        bool active
    ) internal {
        uint32 currentGrowth = getGrowthRate();

        uint32 blockNo = block.number.toUint32();

        timeWeightInfo = TimeWeightInfo(blockNo, weight, growthRate, active);

        emit TimeWeightUpdate(weight, active);
        if (currentGrowth != growthRate) {
            emit GrowthRateUpdate(growthRate);
        }
    }
}
