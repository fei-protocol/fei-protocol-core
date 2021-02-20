pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./UniswapPCVDeposit.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";

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
    function deposit(uint256 ethAmount) external payable override postGenesis {
        require(
            ethAmount == msg.value,
            "Bonding Curve: Sent value does not equal input"
        );

        ethAmount = address(this).balance; // include any ETH dust from prior LP

        uint256 feiAmount = _getAmountFeiToDeposit(ethAmount);

        IWETH weth = IWETH(token());
        weth.deposit{value: ethAmount}();

        _addLiquidity(feiAmount, ethAmount);

        _burnFeiHeld(); // burn any FEI dust from LP

        emit Deposit(msg.sender, ethAmount);
    }

    function _transferWithdrawn(address to, uint256 amount) internal override {
        IWETH weth = IWETH(token());
        weth.withdraw(amount);
        payable(to).sendValue(amount);
    }
}
