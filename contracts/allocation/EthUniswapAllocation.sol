pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./UniswapAllocation.sol";

contract EthUniswapAllocation is UniswapAllocation {

	constructor(address token, address core) 
    UniswapAllocation(token, core) 
    public {}

    function deposit(uint256 ethAmount) override external payable {
    	require(ethAmount == msg.value, "Bonding Curve: Sent value does not equal input");
        uint256 fiiAmount = mintFiiNeededToDeposit(ethAmount);
    	router().addLiquidityETH{value : ethAmount}(address(fii()),
            fiiAmount,
            fiiAmount,
            ethAmount,
            address(this),
            uint256(-1)
        );
    }

    function removeLiquidity(uint256 liquidity, uint256 amountETHMin) override internal returns (uint256) {
        (, uint256 amountWithdrawn) = router().removeLiquidityETH(
            address(fii()),
            liquidity,
            0,
            amountETHMin,
            address(this),
            uint256(-1)
        );
        return amountWithdrawn;
    }

    function transferWithdrawn(uint256 amount) override internal {
        msg.sender.transfer(amount);
    }
}