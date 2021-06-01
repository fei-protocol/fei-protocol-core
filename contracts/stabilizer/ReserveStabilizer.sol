// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IReserveStabilizer.sol";
import "../pcv/IPCVDeposit.sol";
import "../refs/OracleRef.sol";

/// @title implementation for an ERC20 Reserve Stabilizer
/// @author Fei Protocol
contract ReserveStabilizer is OracleRef, IReserveStabilizer, IPCVDeposit {
    using Decimal for Decimal.D256;

    /// @notice the USD per FEI exchange rate denominated in basis points (1/10000)
    uint256 public override usdPerFeiBasisPoints;
    
    /// @notice the denominator for basis granularity (10,000)
    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;

    IERC20 public token;

    constructor(
        address _core,
        address _oracle,
        IERC20 _token,
        uint256 _usdPerFeiBasisPoints
    ) OracleRef(_core, _oracle) {
        require(_usdPerFeiBasisPoints <= BASIS_POINTS_GRANULARITY, "ReserveStabilizer: Exceeds bp granularity");
        usdPerFeiBasisPoints = _usdPerFeiBasisPoints;
        emit UsdPerFeiRateUpdate(0, _usdPerFeiBasisPoints);

        token = _token;
    }

    /// @notice exchange FEI for tokens from the reserves
    /// @param feiAmount of FEI to sell
    function exchangeFei(uint256 feiAmount) external override whenNotPaused returns (uint256 amountOut) {
        updateOracle();

        fei().burnFrom(msg.sender, feiAmount);

        amountOut = getAmountOut(feiAmount);

        _transfer(msg.sender, amountOut);
        emit FeiExchange(msg.sender, feiAmount, amountOut);
    }

    /// @notice returns the amount out of tokens from the reserves for a given amount of FEI
    /// @param amountFeiIn the amount of FEI in
    function getAmountOut(uint256 amountFeiIn) public view override returns(uint256) {
        uint256 adjustedAmountIn = amountFeiIn * usdPerFeiBasisPoints / BASIS_POINTS_GRANULARITY;
        return invert(readOracle()).mul(adjustedAmountIn).asUint256();
    }

    /// @notice withdraw tokens from the reserves
    /// @param to address to send tokens
    /// @param amountOut amount of tokens to send
    function withdraw(address to, uint256 amountOut) external virtual override onlyPCVController {
        _transfer(to, amountOut);
        emit Withdrawal(msg.sender, to, amountOut);
    }

    /// @notice new PCV deposited to the stabilizer
    /// @dev no-op because the token transfer already happened
    function deposit() external override {}

    /// @notice returns the amount of the held ERC-20
    function balance() public view override virtual returns(uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice sets the USD per FEI exchange rate rate
    /// @param newUsdPerFeiBasisPoints the USD per FEI exchange rate denominated in basis points (1/10000)
    function setUsdPerFeiRate(uint256 newUsdPerFeiBasisPoints) external override onlyGovernor {
        require(newUsdPerFeiBasisPoints <= BASIS_POINTS_GRANULARITY, "ReserveStabilizer: Exceeds bp granularity");
        uint256 oldUsdPerFeiBasisPoints = newUsdPerFeiBasisPoints;
        usdPerFeiBasisPoints = newUsdPerFeiBasisPoints;
        emit UsdPerFeiRateUpdate(oldUsdPerFeiBasisPoints, newUsdPerFeiBasisPoints);
    }

    function _transfer(address to, uint256 amount) internal virtual {
        token.transfer(to, amount);
    }
}
