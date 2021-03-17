pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import "./IIncentive.sol";
import "../external/Decimal.sol";

/// @title UniswapIncentive interface
/// @author Fei Protocol
interface IUniswapIncentive is IIncentive {
    // ----------- Events -----------

    event TimeWeightUpdate(uint256 _weight, bool _active);

    event GrowthRateUpdate(uint256 _growthRate);

    event ExemptAddressUpdate(address indexed _account, bool _isExempt);

    // ----------- Governor only state changing api -----------

    function setExemptAddress(address account, bool isExempt) external;

    function setTimeWeightGrowth(uint32 growthRate) external;

    function setTimeWeight(
        uint32 weight,
        uint32 growth,
        bool active
    ) external;

    // ----------- Getters -----------

    function isIncentiveParity() external view returns (bool);

    function isExemptAddress(address account) external view returns (bool);

    // solhint-disable-next-line func-name-mixedcase
    function TIME_WEIGHT_GRANULARITY() external view returns (uint32);

    function getGrowthRate() external view returns (uint32);

    function getTimeWeight() external view returns (uint32);

    function isTimeWeightActive() external view returns (bool);

    function getBuyIncentive(uint256 amount)
        external
        view
        returns (
            uint256 incentive,
            uint32 weight,
            Decimal.D256 memory initialDeviation,
            Decimal.D256 memory finalDeviation
        );

    function getSellPenalty(uint256 amount)
        external
        view
        returns (
            uint256 penalty,
            Decimal.D256 memory initialDeviation,
            Decimal.D256 memory finalDeviation
        );

    function getSellPenaltyMultiplier(
        Decimal.D256 calldata initialDeviation,
        Decimal.D256 calldata finalDeviation
    ) external view returns (Decimal.D256 memory);

    function getBuyIncentiveMultiplier(
        Decimal.D256 calldata initialDeviation,
        Decimal.D256 calldata finalDeviation
    ) external view returns (Decimal.D256 memory);
}
