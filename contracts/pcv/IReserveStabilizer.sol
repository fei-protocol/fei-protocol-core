pragma solidity ^0.6.2;

/// @title a Reserve Stabilizer interface
/// @author Fei Protocol
interface IReserveStabilizer {

    // ----------- Events -----------
    event FeiExchange(address indexed to, uint256 feiAmountIn, uint256 amountOut);

    event UsdPerFeiRateUpdate(uint256 basisPoints);

    event Withdrawal(
        address indexed _caller,
        address indexed _to,
        uint256 _amount
    );

    // ----------- State changing api -----------

    function exchangeFei(uint256 feiAmount) external returns (uint256);

    // ----------- PCV Controller only state changing api -----------

    function withdraw(address payable to, uint256 amount) external;

    // ----------- Governor only state changing api -----------

    function setUsdPerFeiRate(uint256 exchangeRateBasisPoints) external;

    // ----------- Getters -----------

    function usdPerFeiBasisPoints() external view returns (uint256);

    function getAmountOut(uint256 amountIn) external view returns (uint256);
}
