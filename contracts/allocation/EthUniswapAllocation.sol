pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./UniswapAllocation.sol";

contract EthUniswapAllocation is UniswapAllocation {

    address WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    constructor(address core) 
        UniswapAllocation(WETH, core) 
    public {}

    function deposit(uint256 ethAmount) external override payable {
    	require(ethAmount == msg.value, "Bonding Curve: Sent value does not equal input");
        uint256 fiiAmount = getAmountFiiToDeposit(ethAmount);
        _addLiquidity(ethAmount, fiiAmount);
    }

    function addLiquidity(uint256 fiiAmount) public payable onlyGovernor {
        require(msg.value > 0);
        _addLiquidity(msg.value, fiiAmount);
    } 

    function removeLiquidity(uint256 liquidity, uint256 amountETHMin) internal override returns (uint256) {
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

    function transferWithdrawn(uint256 amount) internal override {
        msg.sender.transfer(amount);
    }

    function _addLiquidity(uint256 ethAmount, uint256 fiiAmount) internal {
        mintFii(fiiAmount);
        router().addLiquidityETH{value : ethAmount}(address(fii()),
            fiiAmount,
            0,
            0,
            address(this),
            uint256(-1)
        );
    }
}