pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

interface IBondingCurve {
    // ----------- Events -----------

    event ScaleUpdate(uint256 _scale);

    event BufferUpdate(uint256 _buffer);

    event IncentiveAmountUpdate(uint256 _incentiveAmount);

    event Purchase(address indexed _to, uint256 _amountIn, uint256 _amountOut);

    event Allocate(address indexed _caller, uint256 _amount);

    // ----------- State changing Api -----------

    function purchase(address to, uint256 amountIn)
        external
        payable
        returns (uint256 amountOut);

    function allocate() external;

    // ----------- Governor only state changing api -----------

    function setBuffer(uint256 _buffer) external;

    function setScale(uint256 _scale) external;

    function setAllocation(
        address[] calldata pcvDeposits,
        uint256[] calldata ratios
    ) external;

    function setIncentiveAmount(uint256 _incentiveAmount) external;

    function setIncentiveFrequency(uint256 _frequency) external;

    // ----------- Getters -----------

    function getCurrentPrice() external view returns (Decimal.D256 memory);

    function getAverageUSDPrice(uint256 amountIn)
        external
        view
        returns (Decimal.D256 memory);

    function getAmountOut(uint256 amountIn)
        external
        view
        returns (uint256 amountOut);

    function scale() external view returns (uint256);

    function atScale() external view returns (bool);

    function buffer() external view returns (uint256);

    function totalPurchased() external view returns (uint256);

    function getTotalPCVHeld() external view returns (uint256);

    function incentiveAmount() external view returns (uint256);
}
