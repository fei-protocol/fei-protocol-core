// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../external/Decimal.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBondingCurve {
    // ----------- Events -----------

    event ScaleUpdate(uint256 oldScale, uint256 newScale);

    event BufferUpdate(uint256 oldBuffer, uint256 newBuffer);

    event DiscountUpdate(uint256 oldDiscount, uint256 newDiscount);

    event IncentiveAmountUpdate(uint256 oldIncentiveAmount, uint256 newIncentiveAmount);

    event Purchase(address indexed to, uint256 amountIn, uint256 amountOut);

    event Allocate(address indexed caller, uint256 amount);

    event Reset(uint256 oldTotalPurchased);
    
    // ----------- State changing Api -----------

    function purchase(address to, uint256 amountIn)
        external
        payable
        returns (uint256 amountOut);

    function allocate() external;

    // ----------- Governor only state changing api -----------

    function reset() external;

    function setBuffer(uint256 newBuffer) external;

    function setDiscount(uint256 newDiscount) external;

    function setScale(uint256 newScale) external;

    function setAllocation(
        address[] calldata pcvDeposits,
        uint256[] calldata ratios
    ) external;

    function setIncentiveAmount(uint256 newIncentiveAmount) external;

    function setIncentiveFrequency(uint256 newFrequency) external;

    // ----------- Getters -----------

    function getCurrentPrice() external view returns (Decimal.D256 memory);

    function getAmountOut(uint256 amountIn)
        external
        view
        returns (uint256 amountOut);

    function scale() external view returns (uint256);

    function atScale() external view returns (bool);

    function buffer() external view returns (uint256);

    function discount() external view returns (uint256);

    function totalPurchased() external view returns (uint256);

    function balance() external view returns (uint256);

    function token() external view returns (IERC20);

    function incentiveAmount() external view returns (uint256);
}
