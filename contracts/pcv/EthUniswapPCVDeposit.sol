pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Address.sol";
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

    function deposit(uint ethAmount) external override payable postGenesis {
    	require(ethAmount == msg.value, "Bonding Curve: Sent value does not equal input");
        
        uint feiAmount = _getAmountFeiToDeposit(ethAmount);

        _addLiquidity(ethAmount, feiAmount);

        emit Deposit(msg.sender, ethAmount);
    }

    function _removeLiquidity(uint liquidity) internal override returns (uint) {
        (, uint amountWithdrawn) = router.removeLiquidityETH(
            address(fei()),
            liquidity,
            0,
            0,
            address(this),
            uint(-1)
        );
        return amountWithdrawn;
    }

    function _transferWithdrawn(address to, uint amount) internal override {
        payable(to).sendValue(amount);
    }

    function _addLiquidity(uint ethAmount, uint feiAmount) internal {
        _mintFei(feiAmount);
        
        router.addLiquidityETH{value : ethAmount}(address(fei()),
            feiAmount,
            0,
            0,
            address(this),
            uint(-1)
        );
    }
}