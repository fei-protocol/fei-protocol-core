pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IPCVDeposit.sol";
import "../refs/UniRef.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

/// @title abstract implementation for Uniswap LP PCV Deposit
/// @author Fei Protocol
contract UniswapPCVDeposit is IPCVDeposit, UniRef {
    using Decimal for Decimal.D256;

    uint256 public maxBasisPointsFromPegLP;

    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;

    event MaxBasisPointsFromPegLPUpdate(uint256 oldMaxBasisPointsFromPegLP, uint256 newMaxBasisPointsFromPegLP);

    /// @notice Uniswap PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _pair Uniswap Pair to deposit to
    /// @param _router Uniswap Router
    /// @param _oracle oracle for reference
    constructor(
        address _core,
        address _pair,
        address _router,
        address _oracle,
        uint256 _maxBasisPointsFromPegLP
    ) public UniRef(_core, _pair, _router, _oracle) {
        maxBasisPointsFromPegLP = _maxBasisPointsFromPegLP;
        emit MaxBasisPointsFromPegLPUpdate(0, _maxBasisPointsFromPegLP);
    }

    receive() external payable {
        _wrap();
    }

    /// @notice deposit tokens into the PCV allocation
    /// @param amount of tokens deposited
    function deposit(uint256 amount) external payable override whenNotPaused {
        if (msg.value != 0) {
            _wrap();
        }
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "UniswapPCVDeposit: balance too low");

        uint256 feiAmount = _getAmountFeiToDeposit(balance);

        _addLiquidity(balance, feiAmount);

        _burnFeiHeld(); // burn any FEI dust from LP

        emit Deposit(msg.sender, balance);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying)
        external
        override
        onlyPCVController
        whenNotPaused
    {
        uint256 totalUnderlying = totalValue();
        require(
            amountUnderlying <= totalUnderlying,
            "UniswapPCVDeposit: Insufficient underlying"
        );

        uint256 totalLiquidity = liquidityOwned();

        // ratio of LP tokens needed to get out the desired amount
        Decimal.D256 memory ratioToWithdraw =
            Decimal.ratio(amountUnderlying, totalUnderlying);
        
        // amount of LP tokens factoring in ratio
        uint256 liquidityToWithdraw =
            ratioToWithdraw.mul(totalLiquidity).asUint256();

        uint256 amountWithdrawn = _removeLiquidity(liquidityToWithdraw);

        SafeERC20.safeTransfer(IERC20(token), to, amountWithdrawn);

        _burnFeiHeld();

        emit Withdrawal(msg.sender, to, amountWithdrawn);
    }

    function setMaxBasisPointsFromPegLP(uint256 _maxBasisPointsFromPegLP) public onlyGovernor {
        require(_maxBasisPointsFromPegLP <= BASIS_POINTS_GRANULARITY, "UniswapPCVDeposit: basis points from peg too high");

        uint256 oldMaxBasisPointsFromPegLP = maxBasisPointsFromPegLP;
        maxBasisPointsFromPegLP = _maxBasisPointsFromPegLP;

        emit MaxBasisPointsFromPegLPUpdate(oldMaxBasisPointsFromPegLP, _maxBasisPointsFromPegLP);
    } 

    /// @notice returns total value of PCV in the Deposit
    function totalValue() public view override returns (uint256) {
        (, uint256 tokenReserves) = getReserves();
        return _ratioOwned().mul(tokenReserves).asUint256();
    }

    function _getAmountFeiToDeposit(uint256 amountToken)
        internal
        view
        returns (uint256 amountFei)
    {
        return peg().mul(amountToken).asUint256();
    }

    function _removeLiquidity(uint256 liquidity)
        internal
        returns (uint256)
    {
        uint256 endOfTime = uint256(-1);
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

        uint256 endOfTime = uint256(-1);
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

    function _getMinLiquidity(uint256 amount) internal view returns (uint256) {
        return amount.mul(BASIS_POINTS_GRANULARITY.sub(maxBasisPointsFromPegLP)).div(BASIS_POINTS_GRANULARITY);
    }
}
