// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IUniswapPCVDeposit.sol";
import "./PCVDeposit.sol";
import "../refs/UniRef.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title implementation for Uniswap LP PCV Deposit
/// @author Fei Protocol
contract UniswapPCVDeposit is IUniswapPCVDeposit, PCVDeposit, UniRef {
    using Decimal for Decimal.D256;

    /// @notice a slippage protection parameter, deposits revert when spot price is > this % from oracle
    uint256 public override maxBasisPointsFromPegLP;

    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;

    /// @notice the Uniswap router contract
    IUniswapV2Router02 public override router;

    /// @notice Uniswap PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _pair Uniswap Pair to deposit to
    /// @param _router Uniswap Router
    /// @param _oracle oracle for reference
    /// @param _maxBasisPointsFromPegLP the max basis points of slippage from peg allowed on LP deposit
    constructor(
        address _core,
        address _pair,
        address _router,
        address _oracle,
        uint256 _maxBasisPointsFromPegLP
    ) UniRef(_core, _pair, _oracle) {
        router = IUniswapV2Router02(_router);

        _approveToken(address(fei()));
        _approveToken(token);
        _approveToken(_pair);

        maxBasisPointsFromPegLP = _maxBasisPointsFromPegLP;
        emit MaxBasisPointsFromPegLPUpdate(0, _maxBasisPointsFromPegLP);
    }

    receive() external payable {
        _wrap();
    }

    /// @notice deposit tokens into the PCV allocation
    function deposit() external override whenNotPaused {
        updateOracle();

        // Calculate amounts to provide liquidity
        uint256 tokenAmount = IERC20(token).balanceOf(address(this));
        uint256 feiAmount = readOracle().mul(tokenAmount).asUint256();

        _addLiquidity(tokenAmount, feiAmount);

        _burnFeiHeld(); // burn any FEI dust from LP

        emit Deposit(msg.sender, tokenAmount);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    /// @dev has rounding errors on amount to withdraw, can differ from the input "amountUnderlying"
    function withdraw(address to, uint256 amountUnderlying)
        external
        override
        onlyPCVController
        whenNotPaused
    {
        uint256 totalUnderlying = balance();
        require(
            amountUnderlying <= totalUnderlying,
            "UniswapPCVDeposit: Insufficient underlying"
        );

        uint256 totalLiquidity = liquidityOwned();

        // ratio of LP tokens needed to get out the desired amount
        Decimal.D256 memory ratioToWithdraw =
            Decimal.ratio(amountUnderlying, totalUnderlying);

        // amount of LP tokens to withdraw factoring in ratio
        uint256 liquidityToWithdraw =
            ratioToWithdraw.mul(totalLiquidity).asUint256();

        // Withdraw liquidity from the pair and send to target
        uint256 amountWithdrawn = _removeLiquidity(liquidityToWithdraw);
        SafeERC20.safeTransfer(IERC20(token), to, amountWithdrawn);

        _burnFeiHeld(); // burn remaining FEI

        emit Withdrawal(msg.sender, to, amountWithdrawn);
    }

    /// @notice sets the new slippage parameter for depositing liquidity
    /// @param _maxBasisPointsFromPegLP the new distance in basis points (1/10000) from peg beyond which a liquidity provision will fail
    function setMaxBasisPointsFromPegLP(uint256 _maxBasisPointsFromPegLP)
        public
        override
        onlyGovernor
    {
        require(
            _maxBasisPointsFromPegLP <= BASIS_POINTS_GRANULARITY,
            "UniswapPCVDeposit: basis points from peg too high"
        );

        uint256 oldMaxBasisPointsFromPegLP = maxBasisPointsFromPegLP;
        maxBasisPointsFromPegLP = _maxBasisPointsFromPegLP;

        emit MaxBasisPointsFromPegLPUpdate(
            oldMaxBasisPointsFromPegLP,
            _maxBasisPointsFromPegLP
        );
    }

    /// @notice set the new pair contract
    /// @param _pair the new pair
    /// @dev also approves the router for the new pair token and underlying token
    function setPair(address _pair) external override onlyGovernor {
        _setupPair(_pair);

        _approveToken(token);
        _approveToken(_pair);
    }

    /// @notice returns total balance of PCV in the Deposit excluding the FEI
    function balance() public view override returns (uint256) {
        (, uint256 tokenReserves) = getReserves();
        return _ratioOwned().mul(tokenReserves).asUint256();
    }

    /// @notice amount of pair liquidity owned by this contract
    /// @return amount of LP tokens
    function liquidityOwned() public view override returns (uint256) {
        return pair.balanceOf(address(this));
    }

    function _removeLiquidity(uint256 liquidity) internal returns (uint256) {
        uint256 endOfTime = type(uint256).max;
        // No restrictions on withdrawal price
        (, uint256 amountWithdrawn) =
            router.removeLiquidity(
                address(fei()),
                token,
                liquidity,
                0,
                0,
                address(this),
                endOfTime
            );
        return amountWithdrawn;
    }

    function _addLiquidity(uint256 tokenAmount, uint256 feiAmount) internal {
        _mintFei(feiAmount);

        uint256 endOfTime = type(uint256).max;
        // Deposit price gated by slippage parameter
        router.addLiquidity(
            address(fei()),
            token,
            feiAmount,
            tokenAmount,
            _getMinLiquidity(feiAmount),
            _getMinLiquidity(tokenAmount),
            address(this),
            endOfTime
        );
    }

    /// @notice used as slippage protection when adding liquidity to the pool
    function _getMinLiquidity(uint256 amount) internal view returns (uint256) {
        return
            (amount * (BASIS_POINTS_GRANULARITY - maxBasisPointsFromPegLP)) /
            BASIS_POINTS_GRANULARITY;
    }

    /// @notice ratio of all pair liquidity owned by this contract
    function _ratioOwned() internal view returns (Decimal.D256 memory) {
        uint256 liquidity = liquidityOwned();
        uint256 total = pair.totalSupply();
        return Decimal.ratio(liquidity, total);
    }

    /// @notice approves a token for the router
    function _approveToken(address _token) internal {
        uint256 maxTokens = type(uint256).max;
        IERC20(_token).approve(address(router), maxTokens);
    }

    // Wrap all held ETH
    function _wrap() internal {
        uint256 amount = address(this).balance;
        IWETH(router.WETH()).deposit{value: amount}();
    }
}
