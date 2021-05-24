// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IReserveStabilizer.sol";
import "../pcv/IPCVDeposit.sol";
import "../refs/OracleRef.sol";

/// @title implementation for an ETH Reserve Stabilizer
/// @author Fei Protocol
contract ReserveStabilizer is OracleRef, IReserveStabilizer, IPCVDeposit {

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
    ) public OracleRef(_core, _oracle) {
        require(_usdPerFeiBasisPoints <= BASIS_POINTS_GRANULARITY, "ReserveStabilizer: Exceeds bp granularity");
        usdPerFeiBasisPoints = _usdPerFeiBasisPoints;
        emit UsdPerFeiRateUpdate(_usdPerFeiBasisPoints);

        token = _token;
    }

    /// @notice exchange FEI for ETH from the reserves
    /// @param feiAmount of FEI to sell
    function exchangeFei(uint256 feiAmount) external override whenNotPaused returns (uint256 amountOut) {
        fei().burnFrom(msg.sender, feiAmount);

        amountOut = getAmountOut(feiAmount);

        _transfer(msg.sender, amountOut);
        emit FeiExchange(msg.sender, feiAmount, amountOut);
    }

    /// @notice returns the amount out of ETH from the reserves
    /// @param amountFeiIn the amount of FEI in
    function getAmountOut(uint256 amountFeiIn) public view override returns(uint256) {
        uint256 adjustedAmountIn = amountFeiIn * usdPerFeiBasisPoints / BASIS_POINTS_GRANULARITY;
        return invert(peg()).mul(adjustedAmountIn).asUint256();
    }

    /// @notice withdraw ETH from the reserves
    /// @param to address to send ETH
    /// @param amountOut amount of ETH to send
    function withdraw(address to, uint256 amountOut) external virtual override onlyPCVController {
        _transfer(to, amountOut);
        emit Withdrawal(msg.sender, to, amountOut);
    }

    /// @notice new PCV deposited to the stabilizer
    /// @dev no-op because the token transfer already happened
    function deposit(uint256 amount) external payable override {}

    /// @notice returns the amount of the held ERC-20
    function totalValue() public view override virtual returns(uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice sets the USD per FEI exchange rate rate
    /// @param _usdPerFeiBasisPoints the USD per FEI exchange rate denominated in basis points (1/10000)
    function setUsdPerFeiRate(uint256 _usdPerFeiBasisPoints) external override onlyGovernor {
        require(_usdPerFeiBasisPoints <= BASIS_POINTS_GRANULARITY, "ReserveStabilizer: Exceeds bp granularity");
        usdPerFeiBasisPoints = _usdPerFeiBasisPoints;
        emit UsdPerFeiRateUpdate(_usdPerFeiBasisPoints);
    }

    function _transfer(address to, uint256 amount) internal virtual {
        token.transfer(to, amount);
    }
}
