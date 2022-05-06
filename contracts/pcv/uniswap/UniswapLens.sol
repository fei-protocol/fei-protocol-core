// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "../IPCVDepositBalances.sol";
import "../../refs/UniRef.sol";
import "@uniswap/lib/contracts/libraries/Babylonian.sol";

/// @title UniswapLens
/// @author Fei Protocol
/// @notice a contract to read tokens & fei out of a contract that reports balance in Uniswap LP tokens.
contract UniswapLens is IPCVDepositBalances, UniRef {
    using Decimal for Decimal.D256;
    using Babylonian for uint256;

    /// @notice FEI token address
    address private constant FEI = 0x956F47F50A910163D8BF957Cf5846D573E7f87CA;

    /// @notice the deposit inspected
    address public immutable depositAddress;

    /// @notice the token the lens reports balances in
    address public immutable override balanceReportedIn;

    /// @notice true if FEI is token0 in the Uniswap pool
    bool public immutable feiIsToken0;

    constructor(
        address _depositAddress,
        address _core,
        address _oracle,
        address _backupOracle
    )
        UniRef(
            _core,
            IPCVDepositBalances(_depositAddress).balanceReportedIn(), // pair address
            _oracle,
            _backupOracle
        )
    {
        depositAddress = _depositAddress;
        IUniswapV2Pair pair = IUniswapV2Pair(IPCVDepositBalances(_depositAddress).balanceReportedIn());
        address token0 = pair.token0();
        address token1 = pair.token1();
        feiIsToken0 = token0 == FEI;
        balanceReportedIn = feiIsToken0 ? token1 : token0;
    }

    function balance() public view override returns (uint256) {
        (, uint256 tokenReserves) = getReserves();
        return _ratioOwned().mul(tokenReserves).asUint256();
    }

    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        (uint256 reserve0, uint256 reserve1) = getReserves();
        uint256 feiInPool = feiIsToken0 ? reserve0 : reserve1;
        uint256 otherInPool = feiIsToken0 ? reserve1 : reserve0;

        Decimal.D256 memory priceOfToken = readOracle();

        uint256 k = feiInPool * otherInPool;

        // resistant other/fei in pool
        uint256 resistantOtherInPool = Decimal.one().div(priceOfToken).mul(k).asUint256().sqrt();
        uint256 resistantFeiInPool = Decimal.ratio(k, resistantOtherInPool).asUint256();

        Decimal.D256 memory ratioOwned = _ratioOwned();
        return (ratioOwned.mul(resistantOtherInPool).asUint256(), ratioOwned.mul(resistantFeiInPool).asUint256());
    }

    /// @notice ratio of all pair liquidity owned by the deposit contract
    function _ratioOwned() internal view returns (Decimal.D256 memory) {
        uint256 liquidity = liquidityOwned();
        uint256 total = pair.totalSupply();
        return Decimal.ratio(liquidity, total);
    }

    /// @notice amount of pair liquidity owned by the deposit contract
    /// @return amount of LP tokens
    function liquidityOwned() public view virtual returns (uint256) {
        return IPCVDepositBalances(depositAddress).balance();
    }
}
