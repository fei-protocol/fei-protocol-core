pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./UniswapPCVDeposit.sol";

/// @title implementation for an ETH Uniswap LP PCV Deposit
/// @author Fei Protocol
contract EthUniswapPCVDeposit is UniswapPCVDeposit {
    using Address for address payable;

    /// @notice ETH Uniswap PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _pair Uniswap Pair to deposit to
    /// @param _router Uniswap Router
    /// @param _oracle oracle for reference
    constructor(
        address _core,
        address _pair,
        address _router,
        address _oracle
    ) public UniswapPCVDeposit(_core, _pair, _router, _oracle) {}

    receive() external payable {}

    /// @notice deposit tokens into the PCV allocation
    /// @param ethAmount of tokens deposited
    function deposit(uint256 ethAmount) external payable override postGenesis whenNotPaused {
        require(
            ethAmount == msg.value,
            "Bonding Curve: Sent value does not equal input"
        );

        ethAmount = address(this).balance; // include any ETH dust from prior LP

        uint256 feiAmount = _getAmountFeiToDeposit(ethAmount);

        _addLiquidity(ethAmount, feiAmount);

        _burnFeiHeld(); // burn any FEI dust from LP

        emit Deposit(msg.sender, ethAmount);
    }

    function _removeLiquidity(uint256 liquidity)
        internal
        override
        returns (uint256)
    {
        uint256 endOfTime = uint256(-1);
        (, uint256 amountWithdrawn) =
            router.removeLiquidityETH(
                address(fei()),
                liquidity,
                0,
                0,
                address(this),
                endOfTime
            );
        return amountWithdrawn;
    }

    function _transferWithdrawn(address to, uint256 amount) internal override {
        payable(to).sendValue(amount);
    }

    function _addLiquidity(uint256 ethAmount, uint256 feiAmount) internal {
        _mintFei(feiAmount);

        uint256 endOfTime = uint256(-1);
        router.addLiquidityETH{value: ethAmount}(
            address(fei()),
            feiAmount,
            _getMinLiquidity(feiAmount),
            _getMinLiquidity(ethAmount),
            address(this),
            endOfTime
        );
    }
}